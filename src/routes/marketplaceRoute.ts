// File: src/routes/marketplaceRoutes.ts
import express, { Router } from 'express';
import {
  getAllMarketplaceAssets,
  getMarketplaceAssetById,
  createCheckoutSession, handleStripeWebhook
} from '../controllers/marketplaceController';
import { authenticate } from '../middlewares/authMiddleware'; // Assuming you have this middleware

const router = Router();

// Public routes
router.get('/', getAllMarketplaceAssets);
router.get('/:id', getMarketplaceAssetById);

// Authenticated route for initiating purchase
router.post('/create-checkout-session', authenticate, createCheckoutSession);

export default router;
