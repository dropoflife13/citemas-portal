import nodemailer from 'nodemailer';

function getMailConfig() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    throw new Error('Email delivery is not configured. Add the school Gmail SMTP credentials.');
  }

  const port = Number(process.env.SMTP_PORT || 465);
  return {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: { user, pass },
    from: process.env.SMTP_FROM || `CITEMAS Portal <${user}>`,
  };
}

export async function sendPasswordResetCode({ to, code }) {
  const config = getMailConfig();
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  await transporter.sendMail({
    from: config.from,
    to,
    subject: 'Your CITEMAS password reset code',
    text: `Your CITEMAS password reset code is ${code}. It expires in 10 minutes. If you did not request this, you can safely ignore this email.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1f2937">
        <h2 style="margin-bottom:8px">Reset your CITEMAS password</h2>
        <p>Use this verification code to reset your password:</p>
        <p style="font-size:30px;font-weight:700;letter-spacing:8px;margin:24px 0">${code}</p>
        <p>This code expires in 10 minutes. If you did not request it, you can safely ignore this email.</p>
      </div>
    `,
  });
}
