import emailjs from '@emailjs/browser';
import { APP_NAME } from '../constants';

const SERVICE_ID = "service_tps9s6a";
const TEMPLATE_ID = "template_0ahal91";

/**
 * Sends an OTP email to the specified user.
 * @param email The recipient's email address
 * @param name The recipient's name
 * @param otp The OTP code to send
 */
export const sendOtpEmail = async (email: string, name: string, otp: string): Promise<void> => {
  try {
    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_email: email,
        passcode: otp,
        time: new Date().toLocaleTimeString()
      }
    );
    console.log('Success:', response.status, response.text);
  } catch (error: any) {
    console.error('EmailJS Error:', JSON.stringify(error));
    throw error;
  }
};
