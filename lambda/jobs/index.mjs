import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);
const JOBS_TABLE = process.env.DYNAMODB_JOBS_TABLE;
const SWIPES_TABLE = process.env.DYNAMODB_SWIPES_TABLE;
const PROFILES_TABLE = process.env.DYNAMODB_PROFILES_TABLE;

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

async function swipedTargetIds(userId) {
  const res = await ddb.send(
    new QueryCommand({
      TableName: SWIPES_TABLE,
      IndexName: "userId-targetId-index",
      KeyConditionExpression: "userId = :u",
      ExpressionAttributeValues: { ":u": userId },
    })
  );
  return new Set((res.Items || []).map((s) => s.targetId));
}

// Scores a job against the job seeker's profile: +2 per matching skill,
// +3 per word their desired title shares with the job title, +1 for a
// location match. Higher score sorts first; jobs with no signal keep
// their original order.
function scoreJob(job, profile) {
  if (!profile) return 0;
  let score = 0;
  const haystack = `${job.title} ${job.description} ${(job.tags || []).join(
    " "
  )}`.toLowerCase();

  for (const skill of profile.skills || []) {
    if (skill && haystack.includes(skill.toLowerCase())) score += 2;
  }

  if (profile.title) {
    const jobTitle = job.title.toLowerCase();
    for (const word of profile.title.toLowerCase().split(/\s+/)) {
      if (word.length > 2 && jobTitle.includes(word)) score += 3;
    }
  }

  if (
    profile.location &&
    job.location &&
    job.location.toLowerCase().includes(profile.location.toLowerCase())
  ) {
    score += 1;
  }

  return score;
}

export const handler = async (event) => {
  const claims = event.requestContext.authorizer.jwt.claims;
  const method = event.requestContext.http.method;

  if (method === "GET") {
    const [jobsRes, swiped, profileRes] = await Promise.all([
      ddb.send(new ScanCommand({ TableName: JOBS_TABLE })),
      swipedTargetIds(claims.sub),
      ddb.send(new GetCommand({ TableName: PROFILES_TABLE, Key: { userId: claims.sub } })),
    ]);
    const profile = profileRes.Item;
    const jobs = (jobsRes.Items || [])
      .filter((j) => !swiped.has(j.id))
      .map((j) => ({ job: j, score: scoreJob(j, profile) }))
      .sort((a, b) => b.score - a.score)
      .map(({ job }) => job);
    return json(200, jobs);
  }

  if (method === "POST") {
    if (claims["custom:role"] !== "recruiter") {
      return json(403, { error: "only recruiters can post jobs" });
    }
    const body = JSON.parse(event.body || "{}");
    const {
      company,
      title,
      location,
      remote,
      salary,
      tags,
      description,
      color,
    } = body;
    if (!company || !title || !location || !salary || !description) {
      return json(400, { error: "missing fields" });
    }
    const job = {
      id: randomUUID(),
      recruiterId: claims.sub,
      company,
      title,
      location,
      remote: !!remote,
      salary,
      tags: Array.isArray(tags) ? tags : [],
      description,
      color: color || "#ec4899",
      postedAt: "This week",
    };
    await ddb.send(new PutCommand({ TableName: JOBS_TABLE, Item: job }));
    return json(200, job);
  }

  return json(405, { error: "method not allowed" });
};
