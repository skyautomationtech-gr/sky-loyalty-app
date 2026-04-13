import React from 'react';
import { Staff } from '../types';
import ComingSoon from './ComingSoon';

interface TwoFactorAuthProps {
  user: Staff | null;
  onBack: () => void;
}

export default function TwoFactorAuth({ onBack }: TwoFactorAuthProps) {
  return <ComingSoon onBack={onBack} featureName="টু-ফ্যাক্টর অথেন্টিকেশন" />;
}
