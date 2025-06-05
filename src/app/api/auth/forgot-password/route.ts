import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import nodemailer from "nodemailer";

if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD || !process.env.SMTP_FROM) {
  throw new Error('Missing SMTP configuration environment variables');
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    console.log('Looking up user:', email);
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('User not found:', email);
      // Return success even if user doesn't exist for security
      return NextResponse.json(
        { message: "If an account exists, you will receive a password reset email" },
        { status: 200 }
      );
    }

    console.log('Generating reset token');
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    console.log('Updating user with reset token');
    // Save reset token
    await prisma.user.update({
      where: { email },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry: new Date(Date.now() + 3600000), // 1 hour from now
      },
    });

    // Get base URL from environment variables
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.NEXTAUTH_URL || 
                   'http://localhost:3000';
    
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;
    console.log('Reset URL generated:', resetUrl);

    console.log('Attempting to send email');
    try {
      // Verify SMTP connection
      await transporter.verify();
      console.log('SMTP connection verified');

      // Get user's clinic information for branding
      const userWithClinic = await prisma.user.findUnique({
        where: { email },
        include: {
          clinicMemberships: {
            where: { isActive: true },
            include: {
              clinic: {
                select: {
                  name: true,
                  logo: true,
                  email: true
                }
              }
            },
            take: 1
          }
        }
      });

      const clinicName = userWithClinic?.clinicMemberships?.[0]?.clinic?.name || 'Your Healthcare Provider';
      const clinicLogo = userWithClinic?.clinicMemberships?.[0]?.clinic?.logo;

      // Send email with reset link
      await transporter.sendMail({
        from: {
          name: clinicName,
          address: process.env.SMTP_FROM as string
        },
        to: email,
        subject: `Password Reset Request - ${clinicName}`,
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset Request</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #ffffff; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
              
              <!-- Header with Clinic Logo -->
              <div style="background-color: #000000; padding: 40px 30px; text-align: center;">
                ${clinicLogo ? `
                  <img src="${clinicLogo}" alt="${clinicName}" style="max-height: 60px; max-width: 200px; margin-bottom: 20px; object-fit: contain;">
                ` : `
                  <div style="margin-bottom: 20px;">
                    <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">${clinicName}</h2>
                  </div>
                `}
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 400;">Password Reset Request</h1>
              </div>

              <!-- Main Content -->
              <div style="padding: 40px 30px; background-color: #ffffff;">
                <div style="margin-bottom: 30px;">
                  <h2 style="color: #000000; margin: 0 0 16px 0; font-size: 24px; font-weight: 600;">Reset Your Password</h2>
                  <p style="color: #666666; margin: 0; font-size: 16px;">
                    We received a request to reset the password for your account. Click the button below to create a new password.
                  </p>
                </div>

                <!-- Reset Button -->
                <div style="text-align: center; margin: 40px 0;">
                  <a href="${resetUrl}" 
                     style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 4px; font-weight: 600; font-size: 16px;">
                    Reset My Password
                  </a>
                </div>

                <!-- Security Notice -->
                <div style="background-color: #f8f8f8; border-left: 4px solid #000000; padding: 20px; margin: 30px 0;">
                  <h3 style="color: #000000; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">Security Notice</h3>
                  <ul style="color: #666666; margin: 0; padding-left: 20px; font-size: 14px;">
                    <li style="margin-bottom: 8px;">This link will expire in 1 hour for your security</li>
                    <li style="margin-bottom: 8px;">If you didn't request this reset, please ignore this email</li>
                    <li>Your password will remain unchanged until you create a new one</li>
                  </ul>
                </div>

                <!-- Alternative Link -->
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                  <p style="color: #666666; font-size: 14px; margin: 0 0 8px 0;">
                    If the button doesn't work, copy and paste this link into your browser:
                  </p>
                  <p style="color: #000000; font-size: 14px; word-break: break-all; margin: 0;">
                    ${resetUrl}
                  </p>
                </div>
              </div>

              <!-- Footer -->
              <div style="background-color: #f8f8f8; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                <div style="margin-bottom: 20px;">
                  <p style="color: #666666; font-size: 14px; margin: 0;">
                    This email was sent by <strong>${clinicName}</strong>
                  </p>
                  <p style="color: #999999; font-size: 12px; margin: 8px 0 0 0;">
                    This is an automated message, please do not reply to this email.
                  </p>
                </div>
                
                <!-- System Logo -->
                <div style="padding-top: 20px; border-top: 1px solid #e0e0e0;">
                  <p style="color: #999999; font-size: 11px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">
                    Powered by
                  </p>
                  <img src="${baseUrl}/logo.png" alt="CXLUS" style="height: 20px; opacity: 0.7;">
                </div>
              </div>
            </div>
          </body>
          </html>
        `
      });
      console.log('Email sent successfully');
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      throw emailError;
    }

    return NextResponse.json(
      { message: "If an account exists, you will receive a password reset email" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset error details:", {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        message: "Something went wrong",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 