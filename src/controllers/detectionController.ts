// src/controllers/detection.controller.ts

import { Request, Response } from "express";
import {
  runDetectionService,
  getUserDetections,
  getDetectionById,
} from "../services/detectionService";
import { AuthPayload } from '../middlewares/authMiddleware';

interface AuthenticatedRequest extends Request {
  user: AuthPayload;  
}

// export const runDetection = async (req: Request, res: Response):Promise<any> => {
// const userAuth = (req as AuthenticatedRequest).user;
//     const userId =userAuth.userId;
//   const { assetId, imageUrl } = req.body;

//   try {
//     const result = await runDetectionService({ assetId, userId, imageUrl });
//     res.status(200).json(result);
//   } catch (err: any) {
//     res.status(400).json({ message: err.message });
//   }
// };

// Run Detection API endpoint
export const runDetection = async (req: Request, res: Response) => {
  const userAuth = (req as AuthenticatedRequest).user;
  const userId =userAuth.userId;
  const { assetId, imageUrl, saveResult } = req.body;

  // Get pagination parameters from the query string (default to page 1, limit 10)
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  try {
    const result = await runDetectionService({
      assetId,
      userId,
      imageUrl,
      saveResult,
      page,
      limit,
    });
    res.status(200).json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};


export const getDetections = async (req: Request, res: Response):Promise<any> => {
const userAuth = (req as AuthenticatedRequest).user;
    const userId =userAuth.userId;
  try {
    const results = await getUserDetections(userId);
    res.json(results);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getDetection = async (req: Request, res: Response):Promise<any> => {
const userAuth = (req as AuthenticatedRequest).user;
    const userId =userAuth.userId;
  const { id } = req.params;

  try {
    const result = await getDetectionById(id, userId);
    res.json(result);
  } catch (err: any) {
    res.status(404).json({ message: err.message });
  }
};
