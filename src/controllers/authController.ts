import {Request, Response} from "express"
import { sign, verify } from "jsonwebtoken";
import { PrismaClient } from '@prisma/client';
import { registerUser, loginUser, resetPasswordService, logoutUserService, } from "../services/authService";
import { registerUserSchema, loginUserSchema, forgotPasswordSchema, resetPasswordSchema, resendOtpSchema } from "../validators/authSchemas";
import setRefreshTokenCookie  from "../utils/setRefreshTokenCookie";
import { verifyUserOtpService, forgotPasswordService, resendVerificationOtp } from "../services/authService";
import { sendMail } from "../utils/sendMail";


const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "access-secret";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "refresh-secret";

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response):Promise<any> => {
  try {
    const validatedData = registerUserSchema.parse(req.body);
    const { name, email, password } = validatedData;
    const result = await registerUser(name, email, password);
    //setRefreshTokenCookie(res, result.tokens.refreshToken);
    // Exclude password from the response
    return res.status(201).json({
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
      },

      message: "Registration successful. Please verify your email with the OTP sent to you.",
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ errors: error.errors });
    }
    return res.status(500).json({ message: "Registration failed", error: error.message });
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, otp } = req.body;
    const { user, accessToken, refreshToken } = await verifyUserOtpService(email, otp);

    setRefreshTokenCookie(res, refreshToken);

    return res.status(200).json({
      message: "OTP verified successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      tokens: {
        accessToken,
      },
    });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// Resend OTP Controller
export const resendOtp = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email } = resendOtpSchema.parse(req.body);
    await resendVerificationOtp(email);

    return res.status(200).json({ message: "Verification OTP resent successfully" });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to resend OTP", error: error.message });
  }
};

//refresh Token

export const refreshAccessToken = async (req: Request, res: Response): Promise<any> => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    // Verify the refresh token
    const decoded = verify(refreshToken, REFRESH_TOKEN_SECRET);

    if (!decoded || typeof decoded === "string") {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Find refresh token in DB
    const dbToken = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });

    if (!dbToken) {
      return res.status(403).json({ message: "Refresh token not found in database" });
    }

    // Generate new access token
    const accessToken = sign({ userId: decoded.userId, email: decoded.email }, ACCESS_TOKEN_SECRET, {
      expiresIn: "15m", // 15 minutes expiration for the access token
    });

    return res.status(200).json({ accessToken });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: "Error refreshing access token", error: error.message });
    }
  }
};


//Login User Controller
export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const validatedData = loginUserSchema.parse(req.body);
    const { email, password } = validatedData;
    const result = await loginUser(email, password);

    setRefreshTokenCookie(res, result.tokens.refreshToken);

    return res.status(200).json({
      user: result.user,
      tokens: {
        accessToken: result.tokens.accessToken,
      },
      message: "Login successful",
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ errors: error.errors });
    }
    return res.status(401).json({ message: "Login failed", error: error.message });
  }
};


export const forgotPassword = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    const result = await forgotPasswordService(email);
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ errors: error.errors });
    }
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// /src/controllers/authController.ts



export const resetPassword = async (req: Request, res: Response): Promise<any> => {
  try {
    const { token, email, password, confirmPassword } = resetPasswordSchema.parse(req.body);
    const result = await resetPasswordService(token, email, password, confirmPassword);
    await sendMail(`${email}`, "Password Reset Successful", "<p>Your password has been reset successfully.</p>");
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ errors: error.errors });
    }
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};



export const logout = async (req: Request, res: Response): Promise<any> => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(400).json({ message: "No refresh token provided" });
    }

    await logoutUserService(token);

    // Clear the cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: "Logout failed", error: error.message });
  }
};
