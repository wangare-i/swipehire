import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  const { targetType, targetId, direction } = JSON.parse(event.body || "{}");

  if (!targetType || !targetId || !direction) {
    return json(400, { error: "missing fields" });
  }

  const now = new Date().toISOString();
  const swipe = {
    id: randomUUID(),
    targetType,
    targetId,
    direction,
    status: targetType === "job" && direction === "like" ? "matched" : undefined,
    createdAt: now,
    updatedAt: now,
  };

  await ddb.send(
    new PutCommand({ TableName: process.env.DYNAMODB_SWIPES_TABLE, Item: swipe })
  );

  return json(200, swipe);
};
