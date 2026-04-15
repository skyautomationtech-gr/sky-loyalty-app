import { db } from './firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

const updateReferralCodes = async () => {
  const snap = await getDocs(collection(db, 'customers'));
  for (const customerDoc of snap.docs) {
    const data = customerDoc.data();
    if (!data.referralCode) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const referralCode = `SAT-${code}`;
      await updateDoc(doc(db, 'customers', customerDoc.id), {
        referralCode
      });
      console.log(`Updated ${data.name} with ${referralCode}`);
    }
  }
};

updateReferralCodes();
