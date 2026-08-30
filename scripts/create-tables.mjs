import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  ListTablesCommand,
  UpdateTableCommand,
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
});

const JOBS_TABLE = process.env.DYNAMODB_JOBS_TABLE || "jobsearch-jobs";
const RECRUITERS_TABLE =
  process.env.DYNAMODB_RECRUITERS_TABLE || "jobsearch-recruiters";
const SWIPES_TABLE = process.env.DYNAMODB_SWIPES_TABLE || "jobsearch-swipes";
const POSTS_TABLE = process.env.DYNAMODB_POSTS_TABLE || "jobsearch-posts";
const PROFILES_TABLE =
  process.env.DYNAMODB_PROFILES_TABLE || "jobsearch-profiles";
const MESSAGES_TABLE =
  process.env.DYNAMODB_MESSAGES_TABLE || "jobsearch-messages";

const SIMPLE_TABLES = [JOBS_TABLE, RECRUITERS_TABLE, SWIPES_TABLE, POSTS_TABLE];

async function main() {
  const existing = new Set(
    (await client.send(new ListTablesCommand({}))).TableNames || []
  );

  for (const tableName of SIMPLE_TABLES) {
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

  if (existing.has(PROFILES_TABLE)) {
    console.log(`✓ ${PROFILES_TABLE} already exists`);
  } else {
    await client.send(
      new CreateTableCommand({
        TableName: PROFILES_TABLE,
        AttributeDefinitions: [{ AttributeName: "userId", AttributeType: "S" }],
        KeySchema: [{ AttributeName: "userId", KeyType: "HASH" }],
        BillingMode: "PAY_PER_REQUEST",
      })
    );
    console.log(`+ created ${PROFILES_TABLE}`);
  }

  if (existing.has(MESSAGES_TABLE)) {
    console.log(`✓ ${MESSAGES_TABLE} already exists`);
  } else {
    await client.send(
      new CreateTableCommand({
        TableName: MESSAGES_TABLE,
        AttributeDefinitions: [
          { AttributeName: "matchId", AttributeType: "S" },
          { AttributeName: "createdAt", AttributeType: "S" },
        ],
        KeySchema: [
          { AttributeName: "matchId", KeyType: "HASH" },
          { AttributeName: "createdAt", KeyType: "RANGE" },
        ],
        BillingMode: "PAY_PER_REQUEST",
      })
    );
    console.log(`+ created ${MESSAGES_TABLE}`);
  }

  const swipesDesc = await client.send(
    new DescribeTableCommand({ TableName: SWIPES_TABLE })
  );
  const hasGsi = (swipesDesc.Table.GlobalSecondaryIndexes || []).some(
    (gsi) => gsi.IndexName === "userId-targetId-index"
  );
  if (hasGsi) {
    console.log(`✓ ${SWIPES_TABLE} already has userId-targetId-index`);
  } else {
    await client.send(
      new UpdateTableCommand({
        TableName: SWIPES_TABLE,
        AttributeDefinitions: [
          { AttributeName: "userId", AttributeType: "S" },
          { AttributeName: "targetId", AttributeType: "S" },
        ],
        GlobalSecondaryIndexUpdates: [
          {
            Create: {
              IndexName: "userId-targetId-index",
              KeySchema: [
                { AttributeName: "userId", KeyType: "HASH" },
                { AttributeName: "targetId", KeyType: "RANGE" },
              ],
              Projection: { ProjectionType: "ALL" },
            },
          },
        ],
      })
    );
    console.log(`+ added userId-targetId-index to ${SWIPES_TABLE}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
