/**
 * Email Configuration
 * Configure email service for sending verification, password reset, etc.
 */

import nodemailer from 'nodemailer';

// Check if email is properly configured (all required vars must be explicitly set)
const isEmailConfigured = !!(
  process.env.SMTP_HOST && 
  process.env.SMTP_USER && 
  process.env.SMTP_PASSWORD
);

// Email configuration from environment variables (only if configured)
const emailConfig = isEmailConfigured ? {
  host: process.env.SMTP_HOST!,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASSWORD!,
  },
} : null;

// Create transporter only if email is configured
export const emailTransporter = isEmailConfigured && emailConfig
  ? nodemailer.createTransport(emailConfig)
  : null;

// Log configuration status (don't verify connection at startup - it's async and can fail)
if (isEmailConfigured) {
  console.log('✅ Email service configured');
  console.log(`   SMTP Host: ${process.env.SMTP_HOST}`);
  console.log(`   SMTP Port: ${process.env.SMTP_PORT || '587'}`);
  // Note: We don't verify the connection here to avoid blocking startup
  // The connection will be tested when the first email is sent
} else {
  console.warn('⚠️ Email not configured. Email features will be disabled.');
  console.warn('   To enable email, set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD in .env.local');
}

// Email templates
export const emailTemplates = {
  verification: (name: string, token: string) => ({
    subject: 'Verify your email address',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Verify your email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4CAF50;">Verify Your Email Address</h1>
            <p>Hi ${name || 'there'},</p>
            <p>Thank you for signing up for Drum Practice Generator! Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}" 
                 style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Verify Email
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">
              ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}
            </p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">Drum Practice Generator</p>
          </div>
        </body>
      </html>
    `,
    text: `
      Verify Your Email Address
      
      Hi ${name || 'there'},
      
      Thank you for signing up for Drum Practice Generator! Please verify your email address by visiting:
      
      ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}
      
      This link will expire in 24 hours.
      
      If you didn't create an account, you can safely ignore this email.
    `,
  }),

  passwordReset: (name: string, token: string) => ({
    subject: 'Reset your password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Reset your password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #f44336;">Reset Your Password</h1>
            <p>Hi ${name || 'there'},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}" 
                 style="background-color: #f44336; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">
              ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}
            </p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">Drum Practice Generator</p>
          </div>
        </body>
      </html>
    `,
    text: `
      Reset Your Password
      
      Hi ${name || 'there'},
      
      We received a request to reset your password. Visit this link to create a new password:
      
      ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}
      
      This link will expire in 1 hour.
      
      If you didn't request a password reset, you can safely ignore this email.
    `,
  }),

  emailChange: (name: string, newEmail: string, token: string) => ({
    subject: 'Confirm your new email address',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Confirm new email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2196F3;">Confirm Your New Email Address</h1>
            <p>Hi ${name || 'there'},</p>
            <p>You requested to change your email address to <strong>${newEmail}</strong>.</p>
            <p>Click the button below to confirm this change:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verify-email-change?token=${token}" 
                 style="background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Confirm Email Change
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">
              ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verify-email-change?token=${token}
            </p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't request this change, please contact support immediately.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">Drum Practice Generator</p>
          </div>
        </body>
      </html>
    `,
    text: `
      Confirm Your New Email Address
      
      Hi ${name || 'there'},
      
      You requested to change your email address to ${newEmail}.
      
      Visit this link to confirm:
      
      ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verify-email-change?token=${token}
      
      This link will expire in 24 hours.
      
      If you didn't request this change, please contact support immediately.
    `,
  }),
};

/**
 * Get the "from" email address
 * Uses SMTP_FROM if set and valid, otherwise falls back to support@drumpractice.co.uk
 */
function getFromAddress(): string {
  const smtpFrom = process.env.SMTP_FROM?.trim();
  
  // If SMTP_FROM is set and not empty/just whitespace, use it
  if (smtpFrom && smtpFrom.length > 0 && smtpFrom !== '.') {
    return smtpFrom;
  }
  
  // Default to the required address for drumpractice.co.uk domain
  return 'support@drumpractice.co.uk';
}

/**
 * Send email
 * Returns success: false if email is not configured or fails
 */
export async function sendEmail(to: string, subject: string, html: string, text?: string) {
  if (!emailTransporter) {
    console.warn('Email not configured. Cannot send email to:', to);
    return { success: false, error: 'Email service not configured' };
  }

  const fromAddress = getFromAddress();
  
  // Log the from address for debugging
  console.log(`[Email] Sending email from: ${fromAddress} to: ${to}`);

  try {
    const info = await emailTransporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML if no text provided
    });

    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    console.error(`[Email Debug] From address was: "${fromAddress}"`);
    console.error(`[Email Debug] SMTP_FROM env var: "${process.env.SMTP_FROM}"`);
    
    // Provide more helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('550') || error.message.includes('Cannot send a message')) {
        return {
          success: false,
          error: `Email rejected by server. The "from" address must be "support@drumpractice.co.uk". Current from address: "${fromAddress}". Please set SMTP_FROM=support@drumpractice.co.uk in your .env.local file.`,
        };
      }
    }
    
    // Don't throw - return error instead so calling code can handle gracefully
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

