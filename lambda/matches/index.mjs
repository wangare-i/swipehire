import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);
const SWIPES_TABLE = process.env.DYNAMODB_SWIPES_TABLE;
const PROFILES_TABLE = process.env.DYNAMODB_PROFILES_TABLE;

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

function matchId(a, b) {
  return [a, b].sort().join("#");
}

export const handler = async (event) => {
  const claims = event.requestContext.authorizer.jwt.claims;
  const userId = claims.sub;

  const mySwipes = await ddb.send(
    new QueryCommand({
      TableName: SWIPES_TABLE,
      IndexName: "userId-targetId-index",
      KeyConditionExpression: "userId = :u",
      ExpressionAttributeValues: { ":u": userId },
    })
  );

  const myLikes = (mySwipes.Items || []).filter(
    (s) => s.targetType === "profile" && s.direction === "like"
  );

  const results = [];
  for (const like of myLikes) {
    const theirs = await ddb.send(
      new QueryCommand({
        TableName: SWIPES_TABLE,
        IndexName: "userId-targetId-index",
        KeyConditionExpression: "userId = :u AND targetId = :t",
        ExpressionAttributeValues: { ":u": like.targetId, ":t": userId },
      })
    );
    if (theirs.Items?.[0]?.direction !== "like") continue;

    const profileRes = await ddb.send(
      new GetCommand({ TableName: PROFILES_TABLE, Key: { userId: like.targetId } })
    );
    if (!profileRes.Item) continue;

    results.push({
      matchId: matchId(userId, like.targetId),
      profile: profileRes.Item,
    });
  }

  return json(200, results);
};
