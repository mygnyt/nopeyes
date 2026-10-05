export interface Question {
  id: number;
  text: string;
  option_a: string;
  option_b: string;
  date: string;
}

export interface User {
  id: number;
  first_name: string;
  streak: number;
}

export interface VoteStats {
  countA: number;
  countB: number;
  percentA: number;
  percentB: number;
  total: number;
}

export interface TodayResponse {
  question: Question;
  user: User;
  hasVoted: boolean;
  userChoice: 'A' | 'B' | null;
  stats: VoteStats | null;
}

export interface VoteResponse {
  success: boolean;
  alreadyVoted?: boolean;
  choice: 'A' | 'B';
  newStreak: number;
  stats: VoteStats;
  error?: string;
}
