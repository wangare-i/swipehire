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
};

export type Recruiter = {
  id: string;
  name: string;
  title: string;
  company: string;
  bio: string;
  specialties: string[];
  color: string;
  initials: string;
};

export type SwipeDirection = "like" | "pass";
export type TargetType = "job" | "recruiter";
export type ApplicationStatus =
  | "matched"
  | "applied"
  | "interviewing"
  | "offer"
  | "rejected";

export type Swipe = {
  id: string;
  targetType: TargetType;
  targetId: string;
  direction: SwipeDirection;
  status?: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
};

export type Post = {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  likes: number;
};
