export interface Message {
  message: string;
}
export interface User {
  id: number;
  username: string;
  email: string;
  created: string;
}
export interface Skill {
  id: number;
  name: string;
  daily: number;
  created: string;
}
export interface TimeEntry {
  id: number;
  minutes: number;
  created: string;
  skill: Skill;
}
export interface Page<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
export interface Credentials {
  email: string;
  password: string;
}
export interface ProfileInput {
  username: string;
  email: string;
}
export interface SkillInput {
  name: string;
  daily: number;
}
export interface TimeInput {
  skill_id: number;
  minutes: number;
}
export interface SignInResponse extends Message {
  token: string;
  user: User;
}
