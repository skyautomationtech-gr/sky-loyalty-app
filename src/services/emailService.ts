import emailjs from '@emailjs/browser';
import { APP_NAME } from '../constants';

// Initialize EmailJS only once
emailjs.init("RoRkAJ90h9lt1nthn");

const SERVICE_ID = "service_tps9s6a";
const TEMPLATE_ID = "template_0ahal91";

/**
 * Sends an OTP email to the specified user.
 * @param email The recipient's email address
 * @param name The recipient's name (unused in this template but kept for API compatibility)
 * @param otp The OTP code to send
 */
export const sendOtpEmail = async (email: string, name: string, otp: string): Promise<void> => {
  try {
    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_email: email,
        passcode: otp,
        time: new Date().toLocaleTimeString(),
        company_name: APP_NAME || "Sky Automation Tech"
      }
    );
  } catch (error) {
    console.error("EmailJS Error:", error);
    throw new Error('ইমেইল পাঠাতে ব্যর্থ হয়েছে। দয়া করে ইন্টারনেট কানেকশন চেক করে আবার চেষ্টা করুন।');
  }
};
