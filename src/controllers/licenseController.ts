import { Request, Response } from 'express';
import { AuthPayload } from '../middlewares/authMiddleware';
import {
  createLicensePlanService,
  getLicensePlansByAssetService,
  getUserLicensesService,
  getLicenseByIdService,
  getAllLicensesService
} from '../services/licenseService';

interface AuthenticatedRequest extends Request {
  user: AuthPayload;  // required, not optional here
}

// Create a license plan for an asset (asset owner only)
export const createLicensePlan = async (req: Request, res: Response): Promise<any> => {
  try {
    const userAuth = (req as AuthenticatedRequest).user;
    const userId =userAuth.userId;
    const assetId = req.params.assetId;
    const { name, price, licenseTerms } = req.body;

    if (!name || !price || !licenseTerms) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const licensePlan = await createLicensePlanService(userId, assetId, {
      name,
      price,
      licenseTerms,
    });
    res.status(201).json(licensePlan);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to create license plan' });
  }
};

// Get all license plans for an asset
export const getLicensePlansByAsset = async (req: Request, res: Response): Promise<any> => {
  try {
    const assetId = req.params.assetId;
    const plans = await getLicensePlansByAssetService(assetId);
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch license plans' });
  }
};

// Get all licenses for the logged-in user (buyer)
export const getUserLicenses = async (req: Request, res: Response): Promise<any> => {
  try {
    const userAuth = (req as AuthenticatedRequest).user;
    const userId =userAuth.userId;
    const licenses = await getUserLicensesService(userId);
    res.json(licenses);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch licenses' });
  }
};

// Get a license by ID (only if owned by user)
export const getLicenseById = async (req: Request, res: Response): Promise<any> => {
  try {
    const userAuth = (req as AuthenticatedRequest).user;
    const userId =userAuth.userId;
    const licenseId = req.params.id;
    const license = await getLicenseByIdService(licenseId, userId);
    if (!license) return res.status(404).json({ message: 'License not found' });
    res.json(license);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch license' });
  }
};




export const getAllLicenses = async (req: Request, res: Response):Promise<any> => {
  try {
    const licenses = await getAllLicensesService();
    res.json(licenses);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch all licenses' });
  }
};
