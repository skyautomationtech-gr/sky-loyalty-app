import nodemailer from "nodemailer";

const GMAIL_USER = process.env.GMAIL_USER || "skyautomationtech@gmail.com";
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || "tnlsrakcjbikenmv";

async function sendMailWithFallback(mailOptions: nodemailer.SendMailOptions) {
  const user = (process.env.GMAIL_USER || GMAIL_USER).trim();
  const pass = (process.env.GMAIL_APP_PASSWORD || GMAIL_APP_PASSWORD).replace(/\s+/g, "");

  // 1. Try Port 465 SSL
  try {
    const t1 = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 8000,
    });
    return await t1.sendMail(mailOptions);
  } catch (err1: any) {
    console.warn("[Vercel API SMTP] Port 465 SSL failed, trying port 587...", err1?.message);
    // 2. Try Port 587 STARTTLS
    const t2 = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 8000,
    });
    return await t2.sendMail(mailOptions);
  }
}

export default async function handler(req: any, res: any) {
  // Enable CORS for Vercel Serverless
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, name, otp } = req.body || {};

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required" });
  }

  try {
    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background: #008080; color: #ffffff; padding: 10px 18px; border-radius: 12px; font-weight: bold; font-size: 18px; letter-spacing: 0.5px;">
            Sky Automation Tech
          </div>
          <h2 style="margin: 16px 0 6px; font-size: 22px; font-weight: 800; color: #0f172a;">লগইন ওটিপি ভেরিফিকেশন</h2>
          <p style="margin: 0; font-size: 14px; color: #64748b;">Sky Loyalty Management Portal</p>
        </div>

        <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 14px; padding: 24px; text-align: center; margin: 24px 0;">
          <p style="margin: 0 0 10px; font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">আপনার ভেরিফিকেশন কোড (OTP)</p>
          <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #008080; font-family: monospace;">${otp}</div>
          <p style="margin: 10px 0 0; font-size: 12px; color: #94a3b8;">এই কোডটি পরবর্তী ৫ মিনিটের জন্য কার্যকর থাকবে।</p>
        </div>

        <p style="font-size: 14px; line-height: 1.6; color: #475569;">
          প্রিয় <strong>${name || 'ব্যবহারকারী'}</strong>,<br/>
          আপনার অ্যাকাউন্টে নিরাপদে লগইন করার জন্য উপরের কোডটি ব্যবহার করুন। আপনি যদি এটি না চেয়ে থাকেন, তবে অনুগ্রহ করে মেসেজটি এড়িয়ে চলুন।
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

        <div style="text-align: center; font-size: 11px; color: #94a3b8;">
          © ${new Date().getFullYear()} Sky Automation Tech. All rights reserved.<br/>
          Secure Authentication System
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"Sky Automation Tech" <${GMAIL_USER}>`,
      to: email,
      subject: `[Sky Loyalty] আপনার লগইন ভেরিফিকেশন কোড: ${otp}`,
      html: htmlContent,
    };

    const info = await sendMailWithFallback(mailOptions);
    console.log(`[Vercel Serverless] OTP sent to ${email} (Message ID: ${info.messageId})`);
    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error("[Vercel Serverless SMTP Error]:", error);
    return res.status(500).json({ error: error.message || "Failed to send OTP via Gmail" });
  }
}
