import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mailhog',
  port: Number(process.env.SMTP_PORT) || 1025,
  secure: false,
});

const FROM_ADDRESS = process.env.SMTP_FROM || 'noreply@giftable.local';
const APP_URL = process.env.APP_URL || 'http://localhost';

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `"Giftable" <${FROM_ADDRESS}>`,
    to,
    subject: 'Reset your Giftable password',
    text: `You requested a password reset for your Giftable account.\n\nClick the link below to reset your password (valid for 1 hour):\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Giftable</h2>
        <p>You requested a password reset for your Giftable account.</p>
        <p>Click the button below to reset your password (valid for 1 hour):</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">Reset Password</a>
        <p style="color: #6b7280; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Or copy this link: ${resetUrl}</p>
      </div>
    `,
  });
}
