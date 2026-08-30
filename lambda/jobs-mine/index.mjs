import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);
const JOBS_TABLE = process.env.DYNAMODB_JOBS_TABLE;

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  const claims = event.requestContext.authorizer.jwt.claims;
  if (claims["custom:role"] !== "recruiter") {
    return json(403, { error: "only recruiters have job postings" });
  }

  const res = await ddb.send(new ScanCommand({ TableName: JOBS_TABLE }));
  const mine = (res.Items || []).filter((j) => j.recruiterId === claims.sub);
  return json(200, mine);
};
