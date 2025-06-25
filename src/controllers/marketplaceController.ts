// File: /src/controllers/marketplaceController.ts

import { Request, Response } from 'express';
import {
  getAllMarketplaceAssetsService,
  getMarketplaceAssetByIdService,
  purchaseAssetService,
  createStripeCheckoutSessionService,
  handleStripeWebhookService
} from '../services/marketplaceService';
import { AuthPayload } from '../middlewares/authMiddleware';

interface AuthenticatedRequest extends Request {
  user: AuthPayload;
}

// Define a custom interface for webhook requests to include rawBody
interface WebhookRequest extends Request {
  rawBody: Buffer; // rawBody is a Buffer when using express.raw()
}


// GET /api/marketplace
export const getAllMarketplaceAssets = async (req: Request, res: Response): Promise<any> => {
  try {
    const assets = await getAllMarketplaceAssetsService();
    res.status(200).json(assets);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch marketplace assets', error: error.message });
  }
};

// GET /api/marketplace/:id
export const getMarketplaceAssetById = async (req: Request, res: Response): Promise<any> => {
  try {
    const assetId = req.params.id;
    const asset = await getMarketplaceAssetByIdService(assetId);
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    res.status(200).json(asset);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch asset details', error: error.message });
  }
};

// POST /api/marketplace/buy
export const purchaseAsset = async (req: Request, res: Response): Promise<any> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const {  licensePlanId, paymentIntentId } = req.body;

    if ( !licensePlanId || !paymentIntentId) {
      return res.status(400).json({ message: 'Missing purchase details' });
    }

    const result = await purchaseAssetService(user.userId,  licensePlanId, paymentIntentId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: 'Purchase failed', error: error.message });
  }
};

/**
 * POST /api/marketplace/create-checkout-session
 * Initiates the purchase process by creating a Stripe Checkout Session.
 * @param req AuthenticatedRequest (requires user object from auth middleware)
 * @param res Express Response object
 */
export const createCheckoutSession = async (req: Request, res: Response): Promise<any> => {
  try {
    // Ensure the request is authenticated and has user data
    const user = (req as AuthenticatedRequest).user;
    // Extract licensePlanId from the request body
    const { licensePlanId } = req.body;

    // Validate required input
    if (!licensePlanId) {
      return res.status(400).json({ message: 'License plan ID is required' });
    }

    // Call the service to create the Stripe Checkout Session
    const session = await createStripeCheckoutSessionService(user.userId, licensePlanId);

    // Respond with the URL to redirect the client to Stripe Checkout
    res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating Stripe Checkout Session:', error);
    res.status(400).json({ message: 'Failed to initiate purchase', error: error.message });
  }
};

/**
 * POST /api/stripe-webhook
 * Handles incoming webhook events from Stripe for payment fulfillment.
 * IMPORTANT: This route needs a raw body parser BEFORE the express.json() middleware.
 * @param req Express Request object (containing raw body and Stripe-Signature header)
 * @param res Express Response object
 */
export const handleStripeWebhook = async (req: WebhookRequest, res: Response): Promise<any> => {
  const signature = req.headers['stripe-signature'] as string;

  try {
    if (!req.rawBody) {
      throw new Error('Missing raw body');
    }

    await handleStripeWebhookService(req.rawBody, signature);
    res.status(200).json({ received: true });
  } catch (error: any) {
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
};

