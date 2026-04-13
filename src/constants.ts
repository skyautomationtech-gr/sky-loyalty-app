import { Tier, TierConfig, LoyaltyRule } from './types';

export const APP_NAME = 'Sky Automation Tech';
export const APP_LOGO = 'https://i.ibb.co/KzhvR5kj/SAT.png'; // Attempting direct link from ImgBB ID

export const TIER_CONFIGS: Record<Tier, TierConfig> = {
  BRONZE: {
    threshold: 0,
    color: 'from-orange-900/80 to-black',
    border: 'border-orange-700/50',
  },
  SILVER: {
    threshold: 500,
    color: 'from-slate-700/80 to-black',
    border: 'border-slate-400/50',
    animation: 'shimmer',
  },
  GOLD: {
    threshold: 1500,
    color: 'from-yellow-700/80 to-black',
    border: 'border-yellow-500/50',
    glow: 'teal-glow',
  },
  PLATINUM: {
    threshold: 5000,
    color: 'from-teal-900/80 to-black',
    border: 'border-teal-400/50',
    animation: 'holographic',
    glow: 'teal-glow-strong',
  },
};
