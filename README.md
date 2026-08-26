## AjiraSwipe

A dating-app-style way to job hunt: swipe on job postings and recruiter profiles, get "matched," track applications, and share tips in a feed. Built with Next.js (App Router) and DynamoDB. Single-user, no login.

### 1. Set up AWS credentials

Copy the env example and fill in an IAM user/role with DynamoDB read/write access:

```
cp .env.local.example .env.local
```

Edit `.env.local` with your `AWS_REGION`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY`.

### 2. Install dependencies

```
npm install
```

### 3. Create the DynamoDB tables

```
npm run create-tables
```

Creates four pay-per-request tables: jobs, recruiters, swipes, posts (names come from `.env.local`, defaults shown there).

### 4. Seed sample data

```
npm run seed
```

Adds ~10 mock jobs, ~8 mock recruiters, and a few starter feed posts so the deck isn't empty.

### 5. Run the app

```
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### How it works

- **Discover** — swipe (drag or use the buttons) through jobs or recruiters. Swiping right records a "like"; swiping left records a "pass." A liked card triggers an "It's a Match!" screen.
- **Matches** — every job you liked, with a status you can move through matched → applied → interviewing → offer/rejected.
- **Network** — every recruiter you liked.
- **Feed** — a simple shared feed to post tips/updates and like others' posts.

All state lives in DynamoDB (`jobsearch-jobs`, `jobsearch-recruiters`, `jobsearch-swipes`, `jobsearch-posts` by default) — no auth, meant for one person's own use.
