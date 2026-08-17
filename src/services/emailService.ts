import emailjs from '@emailjs/browser';
import { APP_NAME } from '../constants';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

if (PUBLIC_KEY) {
  try {
    emailjs.init({ publicKey: PUBLIC_KEY });
  } catch (e) {
    console.warn('EmailJS init warning:', e);
  }
}

/**
 * Sends an OTP email to the specified user using Gmail SMTP first (server-side),
 * falling back to EmailJS if needed.
 */
export const sendOtpEmail = async (email: string, name: string, otp: string): Promise<void> => {
  // 1. Try Gmail SMTP via backend server
  try {
    const res = await fetch('/api/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, name, otp }),
    });

    if (res.ok) {
      const data = await res.json();
      console.log('✅ OTP sent via Gmail SMTP:', data);
      return;
    } else {
      const errData = await res.json().catch(() => ({}));
      console.warn('Gmail SMTP endpoint returned error, trying fallback:', errData);
    }
  } catch (apiErr) {
    console.warn('Failed to call /api/send-otp, checking fallback...', apiErr);
  }

  // 2. Fallback to EmailJS if configured
  if (SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY) {
    try {
      const response = await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        {
          to_email: email,
          to_name: name,
          email: email,
          name: name,
          passcode: otp,
          otp: otp,
          time: new Date().toLocaleTimeString(),
          app_name: APP_NAME
        },
        PUBLIC_KEY
      );
      console.log('EmailJS Success:', response.status, response.text);
      return;
    } catch (error: any) {
      console.error('EmailJS Error:', error);
      throw new Error(`OTP পাঠাতে সমস্যা হয়েছে: ${error?.text || error?.message || 'Email delivery failed'}`);
    }
  }

  throw new Error('ইমেইল সার্ভিস অনুপলব্ধ। দয়া করে ইন্টারনেট সংযোগ অথবা কনফিগারেশন চেক করুন।');
};
