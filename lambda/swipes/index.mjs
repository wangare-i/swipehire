import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);
const SWIPES_TABLE = process.env.DYNAMODB_SWIPES_TABLE;

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  const claims = event.requestContext.authorizer.jwt.claims;
  const userId = claims.sub;

  const { targetType, targetId, direction } = JSON.parse(event.body || "{}");
  if (!targetType || !targetId || !direction) {
    return json(400, { error: "missing fields" });
  }

  const id = `${userId}#${targetId}`;
  const now = new Date().toISOString();

  let status;
  if (targetType === "job" && direction === "like") {
    const existing = await ddb.send(
      new GetCommand({ TableName: SWIPES_TABLE, Key: { id } })
    );
    status = existing.Item?.status ?? "matched";
  }

  const swipe = {
    id,
    userId,
    targetType,
    targetId,
    direction,
    status,
    createdAt: now,
    updatedAt: now,
  };
  await ddb.send(new PutCommand({ TableName: SWIPES_TABLE, Item: swipe }));

  let matched = false;
  if (targetType === "profile" && direction === "like") {
    const reciprocal = await ddb.send(
      new QueryCommand({
        TableName: SWIPES_TABLE,
        IndexName: "userId-targetId-index",
        KeyConditionExpression: "userId = :u AND targetId = :t",
        ExpressionAttributeValues: { ":u": targetId, ":t": userId },
      })
    );
    matched = reciprocal.Items?.[0]?.direction === "like";
  }

  return json(200, { swipe, matched });
};
