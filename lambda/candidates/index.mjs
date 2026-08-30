import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);
const PROFILES_TABLE = process.env.DYNAMODB_PROFILES_TABLE;
const SWIPES_TABLE = process.env.DYNAMODB_SWIPES_TABLE;

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  const claims = event.requestContext.authorizer.jwt.claims;
  if (claims["custom:role"] !== "recruiter") {
    return json(403, { error: "only recruiters can browse candidates" });
  }

  const [profilesRes, swipesRes] = await Promise.all([
    ddb.send(new ScanCommand({ TableName: PROFILES_TABLE })),
    ddb.send(
      new QueryCommand({
        TableName: SWIPES_TABLE,
        IndexName: "userId-targetId-index",
        KeyConditionExpression: "userId = :u",
        ExpressionAttributeValues: { ":u": claims.sub },
      })
    ),
  ]);

  const swiped = new Set((swipesRes.Items || []).map((s) => s.targetId));
  const deck = (profilesRes.Items || []).filter(
    (p) => p.role === "jobseeker" && p.userId !== claims.sub && !swiped.has(p.userId)
  );

  return json(200, deck);
};
