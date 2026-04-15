export type Role = 'Admin' | 'Staff' | 'Master Admin';
export type Tier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
export type TransactionType = 'ADD' | 'REDEEM';
export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

export interface Branch {
  id: string;
  name: string;
  location: string;
  phone: string;
  managerId: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  image?: string;
  status: 'active' | 'inactive';
  category: string;
}

export interface Staff {
  id: string;
  uid?: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  pin?: string;
  addedBy: string;
  addedDate: string;
  status: 'active' | 'inactive';
  branchId?: string; // Multi-branch support
}

export interface Customer {
  id: string;
  customerId: string;
  referralCode: string; // Unique referral code like SAT-ABCD
  name: string;
  email: string;
  phone: string;
  address?: string;
  birthday?: string;
  points: number;
  tier: Tier;
  joinedAt: string;
  lastVisit: string;
  branchId?: string; // Multi-branch support
  referralId?: string; // ID of the customer who referred this customer
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
  branchId?: string; // Multi-branch support
  rewardId?: string; // If it was a redemption
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
