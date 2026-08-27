import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  const method = event.requestContext.http.method;

  if (method === "GET") {
    const [jobsRes, swipesRes] = await Promise.all([
      ddb.send(new ScanCommand({ TableName: process.env.DYNAMODB_JOBS_TABLE })),
      ddb.send(new ScanCommand({ TableName: process.env.DYNAMODB_SWIPES_TABLE })),
    ]);
    const jobsById = new Map((jobsRes.Items || []).map((j) => [j.id, j]));
    const matches = (swipesRes.Items || [])
      .filter((s) => s.targetType === "job" && s.direction === "like")
      .map((s) => ({ swipe: s, job: jobsById.get(s.targetId) }))
      .filter((m) => m.job)
      .sort((a, b) => b.swipe.createdAt.localeCompare(a.swipe.createdAt));
    return json(200, matches);
  }

  if (method === "PATCH") {
    const { swipeId, status } = JSON.parse(event.body || "{}");
    if (!swipeId || !status) return json(400, { error: "missing fields" });

    await ddb.send(
      new UpdateCommand({
        TableName: process.env.DYNAMODB_SWIPES_TABLE,
        Key: { id: swipeId },
        UpdateExpression: "SET #s = :s, updatedAt = :u",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":s": status, ":u": new Date().toISOString() },
      })
    );
    return json(200, { ok: true });
  }

  return json(405, { error: "method not allowed" });
};
