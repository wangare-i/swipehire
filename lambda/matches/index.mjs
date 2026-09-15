import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);
const SWIPES_TABLE = process.env.DYNAMODB_SWIPES_TABLE;
const PROFILES_TABLE = process.env.DYNAMODB_PROFILES_TABLE;
const MESSAGES_TABLE = process.env.DYNAMODB_MESSAGES_TABLE;

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

function matchId(a, b) {
  return [a, b].sort().join("#");
}

async function latestMessageAt(id) {
  const res = await ddb.send(
    new QueryCommand({
      TableName: MESSAGES_TABLE,
      KeyConditionExpression: "matchId = :m",
      ExpressionAttributeValues: { ":m": id },
      ScanIndexForward: false,
      Limit: 1,
    })
  );
  return res.Items?.[0]?.createdAt ?? null;
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
    const theirSwipe = theirs.Items?.[0];
    if (theirSwipe?.direction !== "like") continue;

    const [profileRes, lastMessageAt] = await Promise.all([
      ddb.send(new GetCommand({ TableName: PROFILES_TABLE, Key: { userId: like.targetId } })),
      latestMessageAt(matchId(userId, like.targetId)),
    ]);
    if (!profileRes.Item) continue;

    results.push({
      matchId: matchId(userId, like.targetId),
      profile: profileRes.Item,
      matchedAt: like.createdAt > theirSwipe.createdAt ? like.createdAt : theirSwipe.createdAt,
      lastMessageAt,
    });
  }

  return json(200, results);
};
