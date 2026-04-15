import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

export type ActionType = 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'ADD_CUSTOMER' 
  | 'UPDATE_CUSTOMER' 
  | 'DELETE_CUSTOMER' 
  | 'ADD_POINTS' 
  | 'REDEEM_POINTS' 
  | 'UPDATE_STAFF' 
  | 'DELETE_STAFF' 
  | 'UPDATE_RULES'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_RESET_SUCCESS';

export interface AuditLog {
  action: ActionType;
  staffId: string;
  staffName: string;
  targetId?: string;
  targetName?: string;
  details: string;
  timestamp: string;
  ip?: string;
}

export const logAction = async (log: Omit<AuditLog, 'timestamp'>) => {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      ...log,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Audit Log Error:', err);
  }
};
