import React from 'react';
import { Staff } from '../types';
import ComingSoon from './ComingSoon';

interface LoyaltyRulesProps {
  onBack: () => void;
  currentUser: Staff | null;
}

export default function LoyaltyRules({ onBack }: LoyaltyRulesProps) {
  return <ComingSoon onBack={onBack} featureName="লয়্যালটি রুলস" />;
}
