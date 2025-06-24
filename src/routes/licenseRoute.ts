import express from 'express';
import {
  createLicensePlan,
  getLicensePlansByAsset,
  getUserLicenses,
  getLicenseById,
  getAllLicenses,
} from '../controllers/licenseController';
import { authenticate } from '../middlewares/authMiddleware';

const router: express.Router = express.Router();

// Create a license plan for an asset (only asset owner)
router.post('/assets/:assetId/license-plans', authenticate, createLicensePlan);

// Get all license plans for a given asset (public)
router.get('/assets/:assetId/license-plans', getLicensePlansByAsset);

// Get all licenses for the authenticated user (buyer)
router.get('/licenses', authenticate, getUserLicenses);

// Get license details by id (buyer only)
router.get('/licenses/:id', authenticate, getLicenseById);

router.get('/', authenticate, getAllLicenses);



export default router;
