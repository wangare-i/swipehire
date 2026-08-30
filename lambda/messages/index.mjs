import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);
const MESSAGES_TABLE = process.env.DYNAMODB_MESSAGES_TABLE;

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

function isMember(matchId, userId) {
  return matchId.split("#").includes(userId);
}

export const handler = async (event) => {
  const claims = event.requestContext.authorizer.jwt.claims;
  const method = event.requestContext.http.method;

  if (method === "GET") {
    const matchId = event.queryStringParameters?.matchId;
    if (!matchId) return json(400, { error: "matchId required" });
    if (!isMember(matchId, claims.sub)) return json(403, { error: "not your match" });

    const res = await ddb.send(
      new QueryCommand({
        TableName: MESSAGES_TABLE,
        KeyConditionExpression: "matchId = :m",
        ExpressionAttributeValues: { ":m": matchId },
      })
    );
    return json(200, res.Items || []);
  }

  if (method === "POST") {
    const { matchId, content } = JSON.parse(event.body || "{}");
    if (!matchId || !content?.trim()) {
      return json(400, { error: "missing fields" });
    }
    if (!isMember(matchId, claims.sub)) return json(403, { error: "not your match" });

    const message = {
      matchId,
      createdAt: new Date().toISOString(),
      senderId: claims.sub,
      content: content.trim(),
    };
    await ddb.send(new PutCommand({ TableName: MESSAGES_TABLE, Item: message }));
    return json(200, message);
  }

  return json(405, { error: "method not allowed" });
};
