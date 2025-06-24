import { Router } from 'express';
import { uploadAsset, getUserAssets,getAssetById, updateAsset, deleteAsset, } from '../controllers/assetController';

import { authenticate } from "../middlewares/authMiddleware";
import multer from 'multer';
const upload = multer({ dest: 'temp/' }); // temporary storage only for Cloudinary

const router:Router = Router();

router.post('/upload', authenticate, upload.single('file'), uploadAsset);
router.get('/', authenticate, getUserAssets);
router.get('/:id', authenticate, getAssetById);
router.put('/:id', authenticate, updateAsset);
router.delete('/:id', authenticate, deleteAsset);

export default router;
