import nodemailer from "nodemailer"
import dotenv from "dotenv";
dotenv.config();
const transporter = nodemailer.createTransport({
  service: "Gmail", // or use your SMTP provider
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

export const sendVerificationEmail = async (email: string, token: string) => {
  //const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"IpChain Vault" <${process.env.EMAIL}>`,
    to: email,
    
    subject: "Your Email Verification Code",
    html: `
      <h2>Verify Your Email</h2>
      <p>Your verification code is:</p>
      <h1>${token}</h1>
      <p>This code expires in 10 minutes.</p>
    `,
  });
};
