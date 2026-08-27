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
  const [jobsRes, swipesRes] = await Promise.all([
    ddb.send(new ScanCommand({ TableName: process.env.DYNAMODB_JOBS_TABLE })),
    ddb.send(new ScanCommand({ TableName: process.env.DYNAMODB_SWIPES_TABLE })),
  ]);

  const jobs = jobsRes.Items || [];
  const swipes = swipesRes.Items || [];
  const swipedIds = new Set(
    swipes.filter((s) => s.targetType === "job").map((s) => s.targetId)
  );
  const deck = jobs.filter((j) => !swipedIds.has(j.id));

  return json(200, deck);
};
