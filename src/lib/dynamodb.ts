import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
});

export const ddb = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

export const TABLES = {
  jobs: process.env.DYNAMODB_JOBS_TABLE || "jobsearch-jobs",
  recruiters: process.env.DYNAMODB_RECRUITERS_TABLE || "jobsearch-recruiters",
  swipes: process.env.DYNAMODB_SWIPES_TABLE || "jobsearch-swipes",
  posts: process.env.DYNAMODB_POSTS_TABLE || "jobsearch-posts",
};
