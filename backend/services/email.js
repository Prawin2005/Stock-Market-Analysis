import nodemailer from 'nodemailer';

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
  FRONTEND_URL,
} = process.env;

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn('[Email] SMTP credentials not configured. Email sending will be simulated.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return transporter;
}

/**
 * Send a password reset email.
 * @param {string} toEmail - Recipient email address.
 * @param {string} resetToken - The reset token to include in the link.
 * @returns {Promise<{sent: boolean, previewUrl?: string}>}
 */
export async function sendPasswordResetEmail(toEmail, resetToken) {
  const resetUrl = `${FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: SMTP_FROM || `"Alpha Capital" <${SMTP_USER}>`,
    to: toEmail,
    subject: '🔑 Reset your Alpha Capital password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Reset your password</title>
      </head>
      <body style="margin:0;padding:0;background:#0a0a0f;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="520" cellpadding="0" cellspacing="0"
                style="background:linear-gradient(135deg,#12121e,#0d0d1a);
                       border:1px solid rgba(255,255,255,0.07);
                       border-radius:16px;overflow:hidden;">
                
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,rgba(0,255,128,0.08),rgba(56,189,248,0.05));
                              padding:32px 40px 24px;border-bottom:1px solid rgba(255,255,255,0.05);">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <span style="font-size:28px;font-weight:800;
                                       background:linear-gradient(90deg,#00ff80,#38bdf8);
                                       -webkit-background-clip:text;color:#00ff80;
                                       letter-spacing:-0.5px;">α Alpha Capital</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:36px 40px;">
                    <h2 style="margin:0 0 12px;color:#f1f5f9;font-size:22px;font-weight:700;">
                      Password Reset Request
                    </h2>
                    <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">
                      We received a request to reset the password for your Alpha Capital account
                      associated with <strong style="color:#e2e8f0;">${toEmail}</strong>.
                    </p>
                    <p style="margin:0 0 28px;color:#94a3b8;font-size:15px;line-height:1.6;">
                      Click the button below to set a new password. This link is valid for
                      <strong style="color:#e2e8f0;">1 hour</strong>.
                    </p>

                    <!-- CTA Button -->
                    <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr>
                        <td>
                          <a href="${resetUrl}"
                             style="display:inline-block;padding:14px 32px;
                                    background:linear-gradient(135deg,#00ff80,#00cc66);
                                    color:#0a0a0f;font-size:15px;font-weight:700;
                                    text-decoration:none;border-radius:10px;
                                    letter-spacing:0.3px;">
                            Reset My Password →
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0 0 8px;color:#64748b;font-size:13px;">
                      Or copy and paste this URL in your browser:
                    </p>
                    <p style="margin:0 0 28px;word-break:break-all;">
                      <a href="${resetUrl}"
                         style="color:#38bdf8;font-size:13px;text-decoration:none;">${resetUrl}</a>
                    </p>

                    <div style="background:rgba(251,146,60,0.06);border:1px solid rgba(251,146,60,0.15);
                                border-radius:8px;padding:14px 18px;">
                      <p style="margin:0;color:#fb923c;font-size:13px;line-height:1.5;">
                        ⚠️ If you didn't request this, you can safely ignore this email.
                        Your password will remain unchanged.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.05);">
                    <p style="margin:0;color:#334155;font-size:12px;text-align:center;">
                      © ${new Date().getFullYear()} Alpha Capital. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  const transport = getTransporter();

  if (!transport) {
    // Simulation fallback when SMTP not configured
    console.log(`[Email] SIMULATION — Password reset link for ${toEmail}:`);
    console.log(`  ${resetUrl}`);
    return { sent: true, simulated: true };
  }

  const info = await transport.sendMail(mailOptions);
  console.log(`[Email] Password reset email sent to ${toEmail}. MessageId: ${info.messageId}`);
  return { sent: true, messageId: info.messageId };
}
