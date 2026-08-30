import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);
const JOBS_TABLE = process.env.DYNAMODB_JOBS_TABLE;
const SWIPES_TABLE = process.env.DYNAMODB_SWIPES_TABLE;

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

export const handler = async (event) => {
  const claims = event.requestContext.authorizer.jwt.claims;
  const method = event.requestContext.http.method;

  if (method === "GET") {
    const [jobsRes, swiped] = await Promise.all([
      ddb.send(new ScanCommand({ TableName: JOBS_TABLE })),
      swipedTargetIds(claims.sub),
    ]);
    const jobs = (jobsRes.Items || []).filter((j) => !swiped.has(j.id));
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
