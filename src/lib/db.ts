import { ScanCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { ddb, TABLES } from "./dynamodb";
import type {
  Job,
  Recruiter,
  Swipe,
  Post,
  TargetType,
  SwipeDirection,
  ApplicationStatus,
} from "./types";

export async function getAllJobs(): Promise<Job[]> {
  const res = await ddb.send(new ScanCommand({ TableName: TABLES.jobs }));
  return (res.Items as Job[]) || [];
}

export async function getAllRecruiters(): Promise<Recruiter[]> {
  const res = await ddb.send(new ScanCommand({ TableName: TABLES.recruiters }));
  return (res.Items as Recruiter[]) || [];
}

export async function getAllSwipes(): Promise<Swipe[]> {
  const res = await ddb.send(new ScanCommand({ TableName: TABLES.swipes }));
  return (res.Items as Swipe[]) || [];
}

export async function getAllPosts(): Promise<Post[]> {
  const res = await ddb.send(new ScanCommand({ TableName: TABLES.posts }));
  const items = (res.Items as Post[]) || [];
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function recordSwipe(
  targetType: TargetType,
  targetId: string,
  direction: SwipeDirection
): Promise<Swipe> {
  const now = new Date().toISOString();
  const swipe: Swipe = {
    id: randomUUID(),
    targetType,
    targetId,
    direction,
    status: targetType === "job" && direction === "like" ? "matched" : undefined,
    createdAt: now,
    updatedAt: now,
  };
  await ddb.send(new PutCommand({ TableName: TABLES.swipes, Item: swipe }));
  return swipe;
}

export async function updateSwipeStatus(
  swipeId: string,
  status: ApplicationStatus
): Promise<void> {
  await ddb.send(
    new UpdateCommand({
      TableName: TABLES.swipes,
      Key: { id: swipeId },
      UpdateExpression: "SET #s = :s, updatedAt = :u",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: {
        ":s": status,
        ":u": new Date().toISOString(),
      },
    })
  );
}

export async function createPost(author: string, content: string): Promise<Post> {
  const post: Post = {
    id: randomUUID(),
    author,
    content,
    createdAt: new Date().toISOString(),
    likes: 0,
  };
  await ddb.send(new PutCommand({ TableName: TABLES.posts, Item: post }));
  return post;
}

export async function likePost(postId: string): Promise<void> {
  await ddb.send(
    new UpdateCommand({
      TableName: TABLES.posts,
      Key: { id: postId },
      UpdateExpression: "ADD likes :one",
      ExpressionAttributeValues: { ":one": 1 },
    })
  );
}
