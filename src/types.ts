export type Role = 'Admin' | 'Staff' | 'Master Admin';
export type Tier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
export type TransactionType = 'ADD' | 'REDEEM';
export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

export interface Staff {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  pin?: string;
  addedBy: string;
  addedDate: string;
  status: 'active' | 'inactive';
}

export interface Customer {
  id: string;
  customerId: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  birthday?: string;
  points: number;
  tier: Tier;
  joinedAt: string;
  lastVisit: string;
}

export interface Transaction {
  id: string;
  customerId: string;
  type: TransactionType;
  amount: number;
  pointsAfter: number;
  description: string;
  timestamp: string;
  staffId: string;
}

export interface LoyaltyRule {
  id: string;
  name: string;
  points: number;
  trigger: string;
}

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  timestamp: string;
  icon?: string;
}

export interface Session {
  id: string;
  staffId: string;
  deviceType: 'Mobile' | 'Desktop';
  loginTime: string;
  location: string;
  isCurrent?: boolean;
}

export interface TierConfig {
  threshold: number;
  color: string;
  border: string;
  glow?: string;
  animation?: string;
}
