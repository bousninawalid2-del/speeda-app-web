import nodemailer from 'nodemailer';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const FROM = process.env.EMAIL_FROM ?? 'Speeda <noreply@speeda.ai>';

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/** Send a 6-digit OTP code for email verification */
export async function sendVerificationEmail(to: string, name: string, code: string) {
  const transport = createTransport();
  await transport.sendMail({
    from: FROM,
    to,
    subject: 'Verify your Speeda account',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="color:#0020d4">Welcome to Speeda${name ? ', ' + name : ''}! 👋</h2>
        <p>Your verification code is:</p>
        <div style="font-size:36px;font-weight:700;letter-spacing:8px;color:#0020d4;margin:24px 0;padding:16px;background:#f0f0ff;border-radius:12px;text-align:center">
          ${code}
        </div>
        <p style="color:#666">This code expires in <strong>15 minutes</strong>.</p>
        <hr style="margin:32px 0;border:none;border-top:1px solid #eee"/>
        <p style="font-size:12px;color:#999">If you didn't create a Speeda account, you can safely ignore this email.</p>
      </div>
    `,
  });
}

/** Send a password reset link */
export async function sendPasswordResetEmail(to: string, name: string, token: string) {
  const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`;
  const transport = createTransport();
  await transport.sendMail({
    from: FROM,
    to,
    subject: 'Reset your Speeda password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="color:#0020d4">Reset your password</h2>
        <p>Hi${name ? ' ' + name : ''},</p>
        <p>Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
        <a href="${resetUrl}" style="display:inline-block;margin:24px 0;padding:14px 28px;background:#0020d4;color:#fff;border-radius:10px;text-decoration:none;font-weight:600">
          Reset Password
        </a>
        <p style="color:#666">Or copy this link:<br/><a href="${resetUrl}" style="color:#0020d4">${resetUrl}</a></p>
        <hr style="margin:32px 0;border:none;border-top:1px solid #eee"/>
        <p style="font-size:12px;color:#999">If you didn't request a password reset, you can safely ignore this email.</p>
      </div>
    `,
  });
}

/** Send a magic-link / quick-login email */
export async function sendMagicLinkEmail(to: string, name: string, token: string) {
  const magicUrl = `${APP_URL}/auth/magic?token=${token}`;
  const transport = createTransport();
  await transport.sendMail({
    from: FROM,
    to,
    subject: 'Your Speeda login link',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="color:#0020d4">Sign in to Speeda ⚡</h2>
        <p>Hi${name ? ' ' + name : ''},</p>
        <p>Click the button below to sign in instantly. This link expires in <strong>10 minutes</strong>.</p>
        <a href="${magicUrl}" style="display:inline-block;margin:24px 0;padding:14px 28px;background:#0020d4;color:#fff;border-radius:10px;text-decoration:none;font-weight:600">
          Sign in to Speeda
        </a>
        <p style="color:#666">Or copy this link:<br/><a href="${magicUrl}" style="color:#0020d4">${magicUrl}</a></p>
        <hr style="margin:32px 0;border:none;border-top:1px solid #eee"/>
        <p style="font-size:12px;color:#999">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}
