import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const handler = async () => {
  const [recruitersRes, swipesRes] = await Promise.all([
    ddb.send(new ScanCommand({ TableName: process.env.DYNAMODB_RECRUITERS_TABLE })),
    ddb.send(new ScanCommand({ TableName: process.env.DYNAMODB_SWIPES_TABLE })),
  ]);
  const recruitersById = new Map((recruitersRes.Items || []).map((r) => [r.id, r]));
  const matches = (swipesRes.Items || [])
    .filter((s) => s.targetType === "recruiter" && s.direction === "like")
    .map((s) => ({ swipe: s, recruiter: recruitersById.get(s.targetId) }))
    .filter((m) => m.recruiter)
    .sort((a, b) => b.swipe.createdAt.localeCompare(a.swipe.createdAt));

  return json(200, matches);
};
