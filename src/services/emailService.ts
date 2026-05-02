import emailjs from '@emailjs/browser';
import { APP_NAME } from '../constants';

const SERVICE_ID = "service_tps9s6a";
const TEMPLATE_ID = "template_0ahal91";
const PUBLIC_KEY = "RoRkAJ90h9lt1nthn";

/**
 * Sends an OTP email to the specified user.
 * @param email The recipient's email address
 * @param name The recipient's name
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
        time: new Date().toLocaleTimeString()
      },
      PUBLIC_KEY
    );
    console.log('OTP sent successfully');
  } catch (error) {
    console.error("EmailJS Error:", error);
    throw new Error('OTP পাঠাতে ব্যর্থ হয়েছে। ইমেইল অ্যাড্রেস সঠিক কিনা দেখে আবার চেষ্টা করুন।');
  }
};
