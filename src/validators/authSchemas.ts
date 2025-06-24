import { z } from 'zod';

// Zod schema for validating registration input
export const registerUserSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long."), // Validate name
  email: z.string().email("Invalid email address."), // Validate email format
  password: z.string().min(8, "Password must be at least 8 characters long."), // Validate password length
});


// loginSchema for validating login input
export const loginUserSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(8, "Password must be at least 8 characters long."),
});


export const verifyEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
  token: z.string().length(4, "Verification code must be 4 digits"),
});

// /src/validators/authSchemas.ts
export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});


// /src/validators/authSchemas.ts

export const resetPasswordSchema = z.object({
  token: z.string().min(10, "Token is required"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});




export const resendOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
});
