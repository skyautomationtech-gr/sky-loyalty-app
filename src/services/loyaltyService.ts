import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

/**
 * Gets a customer's total points by their phone number.
 */
export const getCustomerPointsByPhone = async (phoneNumber: string): Promise<number | null> => {
  try {
    // Normalize phone number if necessary - assumes stored as digits
    const normalizedPhone = phoneNumber.replace(/\D/g, '');
    const q = query(
      collection(db, 'customers'),
      where('phone', '==', normalizedPhone)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const customerDoc = querySnapshot.docs[0];
    return customerDoc.data().points;
  } catch (error) {
    console.error('Error fetching customer points:', error);
    throw error;
  }
};

/**
 * Updates a customer's points based on their phone number.
 */
export const updateCustomerPoints = async (phoneNumber: string, points: number, type: 'ADD' | 'REDEEM'): Promise<void> => {
  try {
    const normalizedPhone = phoneNumber.replace(/\D/g, '');
    const q = query(
      collection(db, 'customers'),
      where('phone', '==', normalizedPhone)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error(`Customer not found for phone: ${normalizedPhone}`);
    }
    
    const customerDoc = querySnapshot.docs[0];
    const customer = customerDoc.data();
    
    const newPoints = type === 'ADD' ? (customer.points || 0) + points : (customer.points || 0) - points;
    
    await updateDoc(doc(db, 'customers', customerDoc.id), {
        points: newPoints,
        lastVisit: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error updating customer points:', error);
    throw error;
  }
};
