import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error(
        "STRIPE_SECRET_KEY não está definida. " +
          "Configure no .env.local ou no dashboard da Vercel."
      );
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      typescript: true,
    });
  }
  return _stripe;
}

export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID || "";
export const TRIAL_PERIOD_DAYS = 7;
