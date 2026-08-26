import {
  DynamoDBClient,
  CreateTableCommand,
  ListTablesCommand,
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
});

const TABLES = [
  process.env.DYNAMODB_JOBS_TABLE || "jobsearch-jobs",
  process.env.DYNAMODB_RECRUITERS_TABLE || "jobsearch-recruiters",
  process.env.DYNAMODB_SWIPES_TABLE || "jobsearch-swipes",
  process.env.DYNAMODB_POSTS_TABLE || "jobsearch-posts",
];

async function main() {
  const existing = new Set(
    (await client.send(new ListTablesCommand({}))).TableNames || []
  );

  for (const tableName of TABLES) {
    if (existing.has(tableName)) {
      console.log(`✓ ${tableName} already exists`);
      continue;
    }
    await client.send(
      new CreateTableCommand({
        TableName: tableName,
        AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
        KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
        BillingMode: "PAY_PER_REQUEST",
      })
    );
    console.log(`+ created ${tableName}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
