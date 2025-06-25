import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import setRefreshTokenCookie from '../utils/setRefreshTokenCookie';

// Dummy function to simulate refresh token generation
const generateRefreshToken = (userId: string): string => {
  const payload = { userId };
  const secret = process.env.REFRESH_TOKEN_SECRET! || 'your-secret-key';  // Use your actual secret key
  const options = { expiresIn: '5d' };  // Set your expiration as required
  return jwt.sign( payload,secret,{
    expiresIn: "5d"
  });
};

// Controller function to handle the refresh token logic
const refreshTokenController = (req: Request, res: Response): void => {
  const { userId } = req.body;

  // Validate input
  if (!userId) {
    res.status(400).json({ message: 'User ID is required' });
    return;
  }

  try {
    // Generate the refresh token
    const refreshToken = generateRefreshToken(userId);

    // Set the refresh token as a cookie
    setRefreshTokenCookie(res, refreshToken);

    // Send success response
    res.status(200).json({ message: 'Refresh token set' });
  } catch (error) {
    console.error('Error generating refresh token:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export { refreshTokenController };
