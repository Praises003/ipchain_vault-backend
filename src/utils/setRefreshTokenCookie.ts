import { Response } from "express";

const setRefreshTokenCookie = (res: Response, refreshToken: string) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,    // Prevents access via JavaScript
    secure: process.env.NODE_ENV === 'production', // Only send cookie over HTTPS in production
    maxAge: 5 * 24 * 60 * 60 * 1000, // Cookie expiration time (5 days)
    sameSite: 'none', // Prevent CSRF
  });
};

export default setRefreshTokenCookie;
