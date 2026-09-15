export type Role = "jobseeker" | "recruiter";

export type Job = {
  id: string;
  company: string;
  title: string;
  location: string;
  remote: boolean;
  salary: string;
  tags: string[];
  description: string;
  color: string;
  postedAt: string;
  recruiterId?: string;
};

export type Profile = {
  userId: string;
  role: Role;
  name: string;
  contact: string;
  bio: string;
  color: string;
  initials: string;
  createdAt: string;
  updatedAt: string;
  // jobseeker fields
  title?: string;
  skills?: string[];
  location?: string;
  // recruiter fields
  company?: string;
  specialties?: string[];
};

export type SwipeDirection = "like" | "pass";
export type TargetType = "job" | "profile";
export type ApplicationStatus =
  | "matched"
  | "applied"
  | "interviewing"
  | "offer"
  | "rejected";

export type Swipe = {
  id: string;
  userId: string;
  targetType: TargetType;
  targetId: string;
  direction: SwipeDirection;
  status?: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
};

export type MatchSummary = {
  matchId: string;
  profile: Profile;
  matchedAt: string;
  lastMessageAt: string | null;
};

export type Message = {
  matchId: string;
  createdAt: string;
  senderId: string;
  content: string;
};

export type Post = {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  likes: number;
};
