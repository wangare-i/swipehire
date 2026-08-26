import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
});
const ddb = DynamoDBDocumentClient.from(client);

const TABLES = {
  jobs: process.env.DYNAMODB_JOBS_TABLE || "jobsearch-jobs",
  recruiters: process.env.DYNAMODB_RECRUITERS_TABLE || "jobsearch-recruiters",
  posts: process.env.DYNAMODB_POSTS_TABLE || "jobsearch-posts",
};

const jobs = [
  {
    company: "Nimbus Cloud",
    title: "Frontend Engineer",
    location: "San Francisco, CA",
    remote: true,
    salary: "$130k – $165k",
    tags: ["React", "TypeScript", "Next.js"],
    description:
      "Own the customer-facing dashboard used by 50k teams. Small squad, fast releases, real ownership.",
    color: "#ec4899",
  },
  {
    company: "Lattice Data",
    title: "Backend Engineer",
    location: "Austin, TX",
    remote: true,
    salary: "$140k – $175k",
    tags: ["Go", "Postgres", "AWS"],
    description:
      "Build the ingestion pipeline that powers real-time analytics for enterprise clients.",
    color: "#8b5cf6",
  },
  {
    company: "Fernweh Travel",
    title: "Product Designer",
    location: "Remote",
    remote: true,
    salary: "$110k – $140k",
    tags: ["Figma", "Design Systems", "Mobile"],
    description:
      "Shape the design language for a travel app used by millions of trip planners.",
    color: "#f97316",
  },
  {
    company: "Ledger Labs",
    title: "Data Scientist",
    location: "New York, NY",
    remote: false,
    salary: "$150k – $190k",
    tags: ["Python", "ML", "SQL"],
    description:
      "Build fraud-detection models that run on billions of transactions a month.",
    color: "#06b6d4",
  },
  {
    company: "Basecamp Robotics",
    title: "Mobile Engineer (iOS)",
    location: "Seattle, WA",
    remote: true,
    salary: "$135k – $170k",
    tags: ["Swift", "SwiftUI", "iOS"],
    description:
      "Build the app that controls next-gen home robots. Ship weekly, users notice immediately.",
    color: "#22c55e",
  },
  {
    company: "Northwind Health",
    title: "Full Stack Engineer",
    location: "Chicago, IL",
    remote: true,
    salary: "$125k – $155k",
    tags: ["Node.js", "React", "GraphQL"],
    description:
      "Help clinics manage patient scheduling with software people actually enjoy using.",
    color: "#eab308",
  },
  {
    company: "Constellation Games",
    title: "Gameplay Engineer",
    location: "Los Angeles, CA",
    remote: false,
    salary: "$120k – $160k",
    tags: ["C++", "Unreal Engine", "Multiplayer"],
    description:
      "Ship core gameplay systems for our next multiplayer title, launching next year.",
    color: "#a855f7",
  },
  {
    company: "Verdant Energy",
    title: "DevOps Engineer",
    location: "Denver, CO",
    remote: true,
    salary: "$130k – $165k",
    tags: ["Kubernetes", "Terraform", "AWS"],
    description:
      "Keep the grid-monitoring platform at 99.99% uptime as we scale to new states.",
    color: "#14b8a6",
  },
  {
    company: "Hearth Finance",
    title: "Engineering Manager",
    location: "Remote",
    remote: true,
    salary: "$180k – $220k",
    tags: ["Leadership", "Fintech", "Payments"],
    description:
      "Lead a team of 6 building the payments core for a fast-growing fintech.",
    color: "#f43f5e",
  },
  {
    company: "Waypoint Studio",
    title: "UX Researcher",
    location: "Boston, MA",
    remote: true,
    salary: "$105k – $130k",
    tags: ["User Research", "Usability", "B2B"],
    description:
      "Talk to customers every week and turn what you learn into product decisions.",
    color: "#6366f1",
  },
];

const recruiters = [
  {
    name: "Maya Chen",
    title: "Senior Technical Recruiter",
    company: "Nimbus Cloud",
    bio: "I place frontend and design talent at high-growth startups. Fast process, honest feedback, no ghosting.",
    specialties: ["Frontend", "Design", "Startups"],
    color: "#ec4899",
    initials: "MC",
  },
  {
    name: "Daniel Ortiz",
    title: "Talent Partner",
    company: "Lattice Data",
    bio: "Focused on backend and infra roles. I've helped 200+ engineers land offers at data companies.",
    specialties: ["Backend", "Infra", "Data"],
    color: "#8b5cf6",
    initials: "DO",
  },
  {
    name: "Priya Nair",
    title: "Head of Talent",
    company: "Hearth Finance",
    bio: "Building the leadership bench at a fintech scaling fast. Always open to a coffee chat first.",
    specialties: ["Leadership", "Fintech", "Engineering Managers"],
    color: "#f43f5e",
    initials: "PN",
  },
  {
    name: "Jordan Lee",
    title: "Recruiter, Product & Design",
    company: "Fernweh Travel",
    bio: "I recruit product designers and researchers who love travel almost as much as building product.",
    specialties: ["Product Design", "UX Research"],
    color: "#f97316",
    initials: "JL",
  },
  {
    name: "Sofia Marin",
    title: "Technical Sourcer",
    company: "Basecamp Robotics",
    bio: "Sourcing mobile and robotics engineers for a team shipping physical products people love.",
    specialties: ["Mobile", "Robotics", "iOS"],
    color: "#22c55e",
    initials: "SM",
  },
  {
    name: "Ethan Brooks",
    title: "Recruiting Lead",
    company: "Verdant Energy",
    bio: "Hiring DevOps and platform engineers to help modernize the US energy grid.",
    specialties: ["DevOps", "Platform", "Climate Tech"],
    color: "#14b8a6",
    initials: "EB",
  },
  {
    name: "Ana Kowalski",
    title: "Recruiter",
    company: "Ledger Labs",
    bio: "I work with data scientists and ML engineers building fraud and risk models at scale.",
    specialties: ["Data Science", "ML", "Risk"],
    color: "#06b6d4",
    initials: "AK",
  },
  {
    name: "Marcus Webb",
    title: "Talent Acquisition Manager",
    company: "Constellation Games",
    bio: "Bringing gameplay and engine engineers into our next multiplayer title.",
    specialties: ["Gameplay", "Engine", "C++"],
    color: "#a855f7",
    initials: "MW",
  },
];

const posts = [
  {
    author: "Priya",
    content:
      "PSA: tailor your resume's top third to the job title exactly — recruiters skim in under 10 seconds.",
    likes: 12,
  },
  {
    author: "Jordan",
    content:
      "Just wrapped a round of onsites. The candidates who asked what success looks like in 90 days stood out immediately.",
    likes: 8,
  },
  {
    author: "Ana",
    content:
      "Hot take: a thoughtful 3-sentence follow-up email beats a generic thank-you note every time.",
    likes: 5,
  },
];

function withId(item) {
  return { id: randomUUID(), ...item, postedAt: item.postedAt ?? "This week" };
}

async function batchPut(tableName, items) {
  const chunks = [];
  for (let i = 0; i < items.length; i += 25) {
    chunks.push(items.slice(i, i + 25));
  }
  for (const chunk of chunks) {
    await ddb.send(
      new BatchWriteCommand({
        RequestItems: {
          [tableName]: chunk.map((Item) => ({ PutRequest: { Item } })),
        },
      })
    );
  }
}

async function main() {
  const jobItems = jobs.map((j) => withId(j));
  const recruiterItems = recruiters.map((r) => withId(r));
  const postItems = posts.map((p) => ({
    id: randomUUID(),
    ...p,
    createdAt: new Date(
      Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 3
    ).toISOString(),
  }));

  await batchPut(TABLES.jobs, jobItems);
  console.log(`+ seeded ${jobItems.length} jobs`);

  await batchPut(TABLES.recruiters, recruiterItems);
  console.log(`+ seeded ${recruiterItems.length} recruiters`);

  await batchPut(TABLES.posts, postItems);
  console.log(`+ seeded ${postItems.length} posts`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
