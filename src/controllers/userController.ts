import { Request, Response } from 'express';
import { userUpdateSchema } from '../validators/userSchema';
import * as userService from '../services/userService';
import { AuthPayload } from '../middlewares/authMiddleware';

interface AuthenticatedRequest extends Request {
  user: AuthPayload;  // required, not optional here
}

export const getUserProfile = async (req: Request, res: Response):Promise<any> => {
    
  try {
    const userAuth = (req as AuthenticatedRequest).user;
    const userId = userAuth.userId;
    const user = await userService.getUserProfile(userId);
    console.log(userId)
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
};


export const updateUser = async (req:Request  , res: Response):Promise<any> => {
  try {
    const userAuth = (req as AuthenticatedRequest).user;
    const userId = userAuth.userId;
    
    const validatedData = userUpdateSchema.parse(req.body) 

    const {name, email} = validatedData

    const updated = await userService.updateUser(userId, { name, email });
    res.status(200).json(updated);
  } catch (err: any) {
    if (err.message === 'Email is already in use by another account.') {
      return res.status(400).json({ message: err.message });
    }

    res.status(500).json({ message: 'Update failed' });
  }
};

