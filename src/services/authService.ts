import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { hash, compare } from "bcryptjs";
import { sign, verify } from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import {generateOTP} from "../utils/generateOtp"
import { sendVerificationEmail } from '../utils/sendVerificationEmail';
import { sendMail } from '../utils/sendMail';
import crypto from "crypto";

dotenv.config();

interface User {
    id: string,
    name: string,
    email: string,
    password?: string,
    confirmPassword?: string
}

const prisma = new PrismaClient();
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "access-secret";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "refresh-secret";
const ACCESS_EXPIRES_IN = process.env.ACCESS_EXPIRES_IN || "7m"
const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN || "5d"



export const registerUser = async (name:string, email: string, password: string, ): Promise<{ user: User, message: String }> => {
    const existingUser = await prisma.user.findUnique({ where: { email } });

    // If user already exists and is verified, don't allow re-registration
  if (existingUser && existingUser.verified) {
    throw new Error("Email is already registered and verified.");
  }

  // If user exists, clean up any old verification tokens (expired or unverified)
  if (existingUser && !existingUser.verified) {
    // Delete any existing verification tokens for this user
    await prisma.verificationToken.deleteMany({
      where: { userId: existingUser.id },
    });
  }
  
    const hashedPassword = await hash(password, 12);
    const userData = {id: uuid(), name, email, password: hashedPassword };
    let newUser;
  if (!existingUser) {
    // Create the user if it doesn't exist
    newUser= await prisma.user.create({
      data: userData,
    });
  } else {
    // If the user exists, use the existing user object
    newUser = existingUser;
  }
    // const newUser = await prisma.user.create({
    //     data: {
    //         id: uuid(),
    //         name,
    //         email,
    //         password: hashedPassword,
    //     },
    // });
    

   

  

  //GENERATE OTP
    const otp = generateOTP();
    const hashedOtp = await hash(otp, 10);

    const REGISTER_TOKEN_EXPIRATION = new Date(Date.now() + 10 * 60 * 1000);

    const expiresAt = REGISTER_TOKEN_EXPIRATION

  await prisma.verificationToken.create({
    data: {
      token: hashedOtp,
      userId: newUser.id,
      expiresAt,

  }
})

// Send verification email 
await sendVerificationEmail(newUser.email, otp)

return {
    message: "Registration successful. Please verify your email with the OTP sent to you.",
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
    }
    
  };

};

// Email Verification
// /src/services/authService.ts


export const verifyUserOtpService = async (email: string, otp: string): Promise<any> => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw { statusCode: 404, message: "User not found for provided email" };
  }

  const otpRecord = await prisma.verificationToken.findUnique({
    where: { userId: user.id },
  });

  if (!otpRecord) {
    throw { statusCode: 404, message: "OTP not found or already used" };
  }

  const now = new Date();
  if (new Date(otpRecord.expiresAt).valueOf() < now.valueOf()) {
    await prisma.verificationToken.delete({ where: { id: otpRecord.id } });
    throw { statusCode: 400, message: "OTP has expired" };
  }

  const isValidOtp = await compare(otp, otpRecord.token);
  if (!isValidOtp) {
    throw { statusCode: 400, message: "Invalid OTP" };
  }

  await prisma.verificationToken.delete({ where: { id: otpRecord.id } });

  const verifiedUser = await prisma.user.update({
    where: { id: user.id },
    data: { verified: true },
  });

  const accessToken = sign({ userId: user.id, email: user.email }, ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });

  const refreshToken = sign({ userId: user.id }, REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
    },
  });

  return {
    user: verifiedUser,
    accessToken,
    refreshToken,
  };
};



// Login Service
export const loginUser = async (email: string, password: string):Promise<{ user: User; tokens: { accessToken: string; refreshToken: string } }>  => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isPasswordValid = await compare(password, user.password || "");
  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  const accessToken = sign(
    { userId: user.id, email: user.email },
    ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = sign(
    { userId: user.id },
    REFRESH_TOKEN_SECRET,
    { expiresIn: "5d" }
  );

  // Store or rotate refresh token in DB
  await prisma.refreshToken.upsert({
    where: { userId: user.id },
    update: { token: refreshToken },
    create: {
      token: refreshToken,
      userId: user.id,
    },
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    tokens: {
      accessToken,
      refreshToken,
    },
  };
};



// /src/services/authService.ts



export const forgotPasswordService = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw { statusCode: 404, message: "User not found" };
  }

  // Delete existing token if any (optional)
  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id },
  });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 10); // 10 mins

  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
    },
  });

  // Here you would typically send the reset link to the user's email
  await sendMail(user.email, "Here is your Password Reset Code", `Your reset code is: ${token} ` )

  // You'd send the reset link via email in production
  //const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}&email=${email}`;

  //console.log("Reset link:", resetLink); // simulate email sending

  return {
    message: "Password reset code sent to email"
    //resetLink, // only for development
  };
};


// /src/services/authService.ts



export const resetPasswordService = async (token: string, email: string, password: string, confirmPassword: string): Promise<any> => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw { statusCode: 404, message: "User not found" };

  const tokenRecord = await prisma.passwordResetToken.findFirst({
    where: {
      userId: user.id,
      token,
    },
  });

  if (!tokenRecord) {
    throw { statusCode: 400, message: "Invalid or expired token" };
  }

  if (new Date(tokenRecord.expiresAt) < new Date()) {
    await prisma.passwordResetToken.delete({ where: { id: tokenRecord.id } });
    throw { statusCode: 400, message: "Token has expired" };
  }

    

  const hashedPassword = await hash(password, 12);

  
  // Update user's password
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  await prisma.passwordResetToken.delete({
    where: { id: tokenRecord.id },
  });

  return { message: "Password reset successfully" };
};


export const resendVerificationOtp = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new Error("User not found");
  if (user.verified) throw new Error("User already verified");

  const otpCode = generateOTP();
  const hashedOtp = await hash(otpCode, 1);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  // Delete old OTPs
  await prisma.verificationToken.deleteMany({ where: { userId: user.id } });

  // Create new OTP
  await prisma.verificationToken.create({
    data: {
      id: uuid(),
      token: hashedOtp,
      userId: user.id,
      expiresAt,
    },
  });

  // Simulate send (you'd send via nodemailer, Twilio, etc.)
  await sendMail(email, "Use the verification code sent", `This is the code: ${otpCode}`)
};




// Logout Service
export const logoutUserService = async (refreshToken: string): Promise<any> => {
  // Check if refresh token exists
  const tokenInDb = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });

  if (!tokenInDb) {
    throw new Error("Refresh token not found");
  }

  // Delete the refresh token from DB
  await prisma.refreshToken.delete({ where: { token: refreshToken } });

  return { message: "User logged out successfully" };
};
