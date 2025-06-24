import { Request, Response } from 'express';
import { uploadAssetService, getUserAssetsService, getAssetByIdService, updateAssetService, deleteAssetService } from '../services/assetService';
import { AuthPayload } from '../middlewares/authMiddleware';

interface AuthenticatedRequest extends Request {
  user: AuthPayload;  // required, not optional here
}

export const uploadAsset = async (req: Request, res: Response):Promise<any> => {
  try {
    const userAuth = (req as AuthenticatedRequest).user;
    const userId =userAuth.userId;
    const { title, description } = req.body;

    if (!req.file || !req.file.path) {
      return res.status(400).json({ message: 'File is required' });
    }

    const asset = await uploadAssetService(userId, req.file.path, title, description);
    res.status(201).json(asset);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Asset upload failed' });
  }
};



export const getUserAssets = async (req: Request, res: Response):Promise<any> => {
  try {
     const userAuth = (req as AuthenticatedRequest).user;
    const userId =userAuth.userId;
    const assets = await getUserAssetsService(userId);
    res.json(assets);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch assets' });
  }
};


export const getAssetById = async (req: Request, res: Response):Promise<any> => {
  try {
     const userAuth = (req as AuthenticatedRequest).user;
    const userId =userAuth.userId;
    const asset = await getAssetByIdService(req.params.id, userId);
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    res.json(asset);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch asset' });
  }
};


export const updateAsset = async (req: Request, res: Response):Promise<any> => {
  try {
    const userAuth = (req as AuthenticatedRequest).user;
    const userId =userAuth.userId;
    const { title, description } = req.body;
    const result = await updateAssetService(req.params.id, userId, { title, description });

    if (result.count === 0) return res.status(404).json({ message: 'Asset not found or not owned' });
    res.json({ message: 'Asset updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update asset' });
  }
};


export const deleteAsset = async (req: Request, res: Response):Promise<any> => {
  try {
    const userAuth = (req as AuthenticatedRequest).user;
    const userId =userAuth.userId;
    const result = await deleteAssetService(req.params.id, userId);

    if (result.count === 0) return res.status(404).json({ message: 'Asset not found or not owned' });
    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete asset' });
  }
};
