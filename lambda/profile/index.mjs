import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);
const PROFILES_TABLE = process.env.DYNAMODB_PROFILES_TABLE;

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  const claims = event.requestContext.authorizer.jwt.claims;
  const method = event.requestContext.http.method;
  const userId = claims.sub;

  if (method === "GET") {
    const res = await ddb.send(
      new GetCommand({ TableName: PROFILES_TABLE, Key: { userId } })
    );
    if (!res.Item) return json(404, { error: "no profile yet" });
    return json(200, res.Item);
  }

  if (method === "PUT") {
    const body = JSON.parse(event.body || "{}");
    const role = claims["custom:role"];
    const now = new Date().toISOString();

    const existing = await ddb.send(
      new GetCommand({ TableName: PROFILES_TABLE, Key: { userId } })
    );

    const profile = {
      userId,
      role,
      name: body.name || claims.name || "",
      contact: body.contact || "",
      bio: body.bio || "",
      color: body.color || existing.Item?.color || "#ec4899",
      initials:
        (body.name || claims.name || "?").slice(0, 1).toUpperCase(),
      createdAt: existing.Item?.createdAt || now,
      updatedAt: now,
      ...(role === "jobseeker"
        ? {
            title: body.title || "",
            skills: Array.isArray(body.skills) ? body.skills : [],
            location: body.location || "",
          }
        : {
            title: body.title || "",
            company: body.company || "",
            specialties: Array.isArray(body.specialties) ? body.specialties : [],
          }),
    };

    await ddb.send(new PutCommand({ TableName: PROFILES_TABLE, Item: profile }));
    return json(200, profile);
  }

  return json(405, { error: "method not allowed" });
};
