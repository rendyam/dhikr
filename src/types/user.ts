/**
 * User data type definitions for the Muslim Dhikr App.
 *
 * Requirements: All requirements (type safety baseline)
 */

export interface TodoItem {
  id: string; // UUID v4
  title: string;
  notes: string | null;
  completed: boolean;
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
  deletedAt: number | null; // Unix timestamp; null if not soft-deleted
}

export interface StreakData {
  currentStreak: number;
  lastCheckin: string | null; // 'YYYY-MM-DD'
  longestStreak: number;
}

export interface Badge {
  milestone: 7 | 30 | 100;
  earnedAt: number; // Unix timestamp
  rewardClaimed: boolean;
}

export type RewardStatus = 'pending' | 'sent' | 'claimed';

export interface RewardClaim {
  userId: string;
  displayName: string;
  email: string;
  gopayNumber: string;
  milestone: number;
  submittedAt: number; // Unix timestamp
  status: RewardStatus;
}
