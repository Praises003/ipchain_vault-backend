// File: /src/services/marketplaceService.ts

import { PrismaClient } from "../generated/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY! || "", {
  apiVersion: "2025-05-28.basil", 
    typescript: true,   
});

const FRONTEND_SUCCESS_URL = process.env.FRONTEND_SUCCESS_URL || 'http://localhost:3000/purchase-success';
const FRONTEND_CANCEL_URL = process.env.FRONTEND_CANCEL_URL || 'http://localhost:3000/purchase-cancelled';
// The webhook secret for validating Stripe webhook events
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

const prisma = new PrismaClient();

// 1. List all assets available in the marketplace
export const getAllMarketplaceAssetsService = async () => {
  return prisma.asset.findMany({
    include: {
      licensePlans: true,
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

// 2. Get details of a specific asset
export const getMarketplaceAssetByIdService = async (assetId: string) => {
  return prisma.asset.findUnique({
    where: { id: assetId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      licensePlans: true,
      licenses: true,
    },
  });
};

// // 3. Purchase an asset license (via LicensePlan)
// export const purchaseAssetService = async (
//   buyerId: string,
//   licensePlanId: string
// ) => {
//   const plan = await prisma.licensePlan.findUnique({
//     where: { id: licensePlanId },
//     include: {
//       asset: true,
//     },
//   });

//   if (!plan) throw new Error("License plan not found");

//   const existingLicense = await prisma.license.findFirst({
//     where: {
//       assetId: plan.assetId,
//       buyerId,
//     },
//   });

//   if (existingLicense) throw new Error("You already own a license for this asset");

//   const license = await prisma.license.create({
//     data: {
//       assetId: plan.assetId,
//       buyerId,
//       licensePlanId: plan.id,
//       price: new Decimal(plan.price.toString()),
//       licenseTerms: plan.licenseTerms,
//     },
//   });

//   return license;
// };


// 3. Purchase an asset license (via LicensePlan)
export const purchaseAssetService = async (
  buyerId: string,
  licensePlanId: string,
  paymentIntentId: string
) => {
  // Step 1: Retrieve the license plan
  const plan = await prisma.licensePlan.findUnique({
    where: { id: licensePlanId },
    include: {
      asset: true,
    },
  });

  if (!plan) throw new Error("License plan not found");

  // Step 2: Check if the buyer already owns a license for this asset
  const existingLicense = await prisma.license.findFirst({
    where: {
      assetId: plan.assetId,
      buyerId,
    },
  });

  if (existingLicense) throw new Error("You already own a license for this asset");

  // Step 3: Verify the payment via Stripe (paymentIntentId)
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  // Step 4: Check if the payment was successful
  if (paymentIntent.status !== 'succeeded') {
    throw new Error('Payment failed. Please try again.');
  }

  // Step 5: Create the license record in the database
  const license = await prisma.license.create({
    data: {
      assetId: plan.assetId,
      buyerId,
      licensePlanId: plan.id,
      price: new Decimal(plan.price.toString()),
      licenseTerms: plan.licenseTerms,
      status: 'active',
    },
  });

  return license;
};


export const createStripeCheckoutSessionService = async (
  buyerId: string,
  licensePlanId: string
) => {
  // Retrieve the license plan details from your database
  const plan = await prisma.licensePlan.findUnique({
    where: { id: licensePlanId },
    include: {
      asset: true, // Include asset details to use in line_items
    },
  });

  // Validate if the license plan exists
  if (!plan) {
    throw new Error("License plan not found");
  }

  // Check if the buyer already owns a license for this asset
  // This check is good as a pre-validation, but the ultimate source of truth
  // for purchase fulfillment is the Stripe webhook.
  const existingLicense = await prisma.license.findFirst({
    where: {
      assetId: plan.assetId,
      buyerId,
    },
  });

  if (existingLicense) {
    throw new Error("You already own a license for this asset");
  }

  // Convert Decimal price to cents (Stripe expects amount in smallest currency unit)
  // Assuming 'price' is a Decimal and represents currency in major units (e.g., USD, NGN)
  const priceInCents = Math.round(new Decimal(plan.price.toString()).times(100).toNumber());

  // Create a Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'], // Specify payment methods (e.g., card)
    mode: 'payment', // Use 'payment' for one-time purchases
    line_items: [
      {
        price_data: {
          currency: 'ngn', // Your currency (e.g., 'usd', 'eur', 'ngn')
          product_data: {
            name: `${plan.name} License for ${plan.asset.title}`,
            description: plan.licenseTerms, // Use license terms as description
            // You can add an image URL if your asset has one:
            // images: [plan.asset.imageUrl],
            images: plan.asset.fileUrl ? [plan.asset.fileUrl] : [], // Optional image URL
          },
          unit_amount: priceInCents, // Price in cents
        },
        quantity: 1,
      },
    ],
    // These URLs are where Stripe redirects the user after payment or cancellation
    // Pass the session ID to the success URL so frontend can confirm
    success_url: `${FRONTEND_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: FRONTEND_CANCEL_URL,
    // Store important IDs in metadata to retrieve them in the webhook
    metadata: {
      buyerId: buyerId,
      licensePlanId: licensePlanId,
      assetId: plan.assetId,
    },
    // Optionally pre-fill customer email if available
    // customer_email: user.email, // If you have user email from authentication
  });

  return session; // Return the session object (specifically the URL)
};

/**
 * Handles incoming Stripe webhook events to fulfill purchases.
 * This function should be called by your webhook route.
 * @param rawBody The raw request body from Stripe (as a Buffer).
 * @param signature The 'stripe-signature' header value.
 */
export const handleStripeWebhookService = async (rawBody: Buffer, signature: string) => {
  let event: Stripe.Event;

  try {
    // Verify the webhook signature to ensure it's from Stripe and not tampered with
    event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error(`⚠️ Webhook signature verification failed: ${err.message}`);
    throw new Error(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;

      // Extract metadata stored during session creation
      const buyerId = session.metadata?.buyerId;
      const licensePlanId = session.metadata?.licensePlanId;
      const assetId = session.metadata?.assetId;
      const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;


      console.log('Checkout Session Completed:', session.id);
      console.log('Metadata:', { buyerId, licensePlanId, assetId });
      console.log('Payment Intent ID:', paymentIntentId);


      // Ensure we have all necessary IDs
      if (!buyerId || !licensePlanId || !assetId || !paymentIntentId) {
        console.error('Missing metadata in checkout.session.completed event:', session.metadata);
        throw new Error('Missing critical metadata for purchase fulfillment.');
      }

      try {
        // Retrieve the license plan again to get price and terms
        const plan = await prisma.licensePlan.findUnique({
          where: { id: licensePlanId },
        });

        if (!plan) {
          throw new Error(`License plan with ID ${licensePlanId} not found during webhook processing.`);
        }

        // Check again for existing license to prevent double-purchases if webhook fires multiple times
        // (Stripe webhooks are designed to be idempotent, but it's good practice)
        const existingLicense = await prisma.license.findFirst({
          where: {
            assetId: assetId,
            buyerId: buyerId,
          },
        });

        if (existingLicense) {
          console.warn(`User ${buyerId} already has a license for asset ${assetId}. Skipping license creation.`);
          return { message: 'License already exists for this asset.' };
        }

        // Create the license record in your database
        const license = await prisma.license.create({
          data: {
            assetId: assetId,
            buyerId: buyerId,
            licensePlanId: licensePlanId,
            // Ensure price matches the actual transaction, convert back from Stripe's amount_total if needed,
            // or use the price from your stored plan.
            // Stripe's amount_total is in cents, so convert back to your Decimal/major unit.
            price: new Decimal(plan.price.toString()), // Use price from your database plan
            licenseTerms: plan.licenseTerms,
            stripePaymentIntentId: paymentIntentId, // Store the Payment Intent ID for reference
            status: 'active', // Mark the license as active
          },
        });

        console.log('License created successfully:', license);
        return { message: 'Purchase fulfilled successfully', license };

      } catch (dbError: any) {
        console.error('Error creating license in database during webhook fulfillment:', dbError);
        // Important: Depending on the severity, you might want to log this to a system that
        // retries failed webhook events or alerts an administrator.
        throw new Error(`Database error during fulfillment: ${dbError.message}`);
      }

    // Handle other event types if necessary
    // case 'customer.subscription.created':
    //   // ... handle subscription creation
    //   break;
    default:
      console.warn(`Unhandled event type ${event.type}`);
  }

  // Return a response to acknowledge the event
  return { message: 'Webhook event processed (or unhandled type).' };
};
