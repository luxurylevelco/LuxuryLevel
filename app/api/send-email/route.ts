import { BaseEmailProps } from "@/lib/types";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { name, email, message }: BaseEmailProps = await req.json();

    // Basic input validation
    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_EMAIL!,
        pass: process.env.SMTP_EMAIL_PASSWORD!,
      },
    });

    const mailOptions = {
      from: '"Luxury Level Co" <rahimghanaei@luxurylevelco.com>',
      to: process.env.SMTP_EMAIL!,
      subject: `Product Inquiry from ${name}`,
      html: `
        <p><strong>From:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong> ${message}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: "Email sent successfully.",
    });
  } catch (error: unknown) {
    console.error("Email send error:", error);
    return NextResponse.json(
      { success: false, error: (error as { message: string }).message },
      { status: 500 }
    );
  }
}
