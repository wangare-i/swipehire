import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  const method = event.requestContext.http.method;

  if (method === "GET") {
    const res = await ddb.send(
      new ScanCommand({ TableName: process.env.DYNAMODB_POSTS_TABLE })
    );
    const posts = (res.Items || []).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
    return json(200, posts);
  }

  if (method === "POST") {
    const claims = event.requestContext.authorizer.jwt.claims;
    const { content } = JSON.parse(event.body || "{}");
    if (!content || !content.trim()) return json(400, { error: "content required" });

    const post = {
      id: randomUUID(),
      author: claims.name || "Someone",
      createdAt: new Date().toISOString(),
      content: content.trim(),
      likes: 0,
    };
    await ddb.send(
      new PutCommand({ TableName: process.env.DYNAMODB_POSTS_TABLE, Item: post })
    );
    return json(200, post);
  }

  if (method === "PATCH") {
    const { postId } = JSON.parse(event.body || "{}");
    if (!postId) return json(400, { error: "postId required" });

    await ddb.send(
      new UpdateCommand({
        TableName: process.env.DYNAMODB_POSTS_TABLE,
        Key: { id: postId },
        UpdateExpression: "ADD likes :one",
        ExpressionAttributeValues: { ":one": 1 },
      })
    );
    return json(200, { ok: true });
  }

  return json(405, { error: "method not allowed" });
};
