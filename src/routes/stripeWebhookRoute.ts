// File: src/routes/stripeWebhookRoutes.ts
import { Router } from 'express';
import { handleStripeWebhook } from '../controllers/marketplaceController';
import express from 'express'; // Import express to use its raw body parser

const router = Router();

// IMPORTANT: This middleware *must* come before express.json() for other routes
// Stripe webhooks send raw bodies that need to be verified.
// The `raw()` parser makes `req.rawBody` available.
router.post('/', express.raw({ type: 'application/json' }), handleStripeWebhook);

export default router;
