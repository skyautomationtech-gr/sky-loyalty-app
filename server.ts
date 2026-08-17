import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Gmail SMTP Transporter
const GMAIL_USER = process.env.GMAIL_USER || "skyautomationtech@gmail.com";
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || "tnlsrakcjbikenmv";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD.replace(/\s+/g, ""),
  },
});

// API endpoint to send OTP email via Gmail SMTP
app.post("/api/send-otp", async (req, res) => {
  const { email, name, otp } = req.body;

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

    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP] OTP sent to ${email} (Message ID: ${info.messageId})`);
    return res.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error("[SMTP Error] Failed to send email:", error);
    return res.status(500).json({ error: error.message || "Failed to send OTP via Gmail" });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
