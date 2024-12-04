import fs from "node:fs";
import { parse } from "csv";
import Stripe from "stripe";

function getStripeSecretKey() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey || secretKey.length === 0) {
    throw new Error("ERROR: STRIPE_SECRET_KEY wasn't provided");
  }

  return secretKey;
}

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const stripe = new Stripe(getStripeSecretKey());

/**
 * Remove subscriptions matching a starting pattern.
 * Context: I had to look for customers with a "bill emoji" at the start of the string.
 * Improvements: Implement a RegExp search, not just in the name, could be in other places.
 */
async function removeSubscriptions(pattern, delimiter = ",") {
  const parser = parse({ delimiter }, async (err, data) => {
    if (err) {
      console.log(err);

      return;
    }

    // Filter the subscriptions which start with [pattern].
    const subscriptionsId = data
      .slice(1)
      .filter((s) => s[13].startsWith(pattern))
      .map((s) => s[0]);
    for (const s of subscriptionsId) {
      console.log(s);
      await stripe.subscriptions.cancel(s);
      await delay(100);
    }
  });

  fs.createReadStream("subscriptions.csv").pipe(parser);
}

/**
 * Remove customers matching a starting pattern.
 * Context: I had to look for customers with a "bill emoji" at the start of the string.
 * Improvements: Implement a RegExp search, not just in the name, could be in other places.
 */
async function removeCustomers(pattern, delimiter = ",") {
  const parser = parse({ delimiter }, async (err, data) => {
    if (err) {
      console.log(err);

      return;
    }

    // Get customers which names starts with [pattern]
    const customersId = data
      .slice(1)
      .filter((c) => c[3].startsWith(pattern))
      .map((c) => c[0]);
    for (const c of customersId) {
      console.log(c);
      await stripe.customers.del(c);
      await delay(100);
    }
  });

  fs.createReadStream("unified_customers.csv").pipe(parser);
}

/**
 * Upload coupons from a `.csv` file.
 * Context: We were promoting a campaing which needed promotion codes to be handled by Stripe.
 * Improvements: Dynamic file specification, better format support.
 */
async function uploadCoupons(delimiter = ",") {
  const parser = parse({ delimiter }, async (err, data) => {
    if (err) {
      console.log(err);

      return;
    }

    const coupons = data.map((cell) => cell[0]);
    for (const c of coupons) {
      console.log(c);
      await stripe.coupons.create({
        id: c,
        name: c,
        percent_off: 100,
        max_redemptions: 1,
      });
      await delay(100);
    }
  });

  fs.createReadStream("coupons.csv").pipe(parser);
}

async function deleteCoupons(delimiter = ",") {
  const parser = parse({ delimiter }, async (err, data) => {
    if (err) {
      console.log(err);

      return;
    }

    const coupons = data.map((cell) => cell[0]);
    for (const c of coupons) {
      console.log(c);
      await stripe.coupons.del(c);
      await delay(100);
    }
  });

  fs.createReadStream("coupons.csv").pipe(parser);
}

if (Number.parseInt(process.env.REMOVE_SUBSCRIPTIONS)) {
  removeSubscriptions();
}

if (Number.parseInt(process.env.REMOVE_CUSTOMERS)) {
  removeCustomers();
}

if (Number.parseInt(process.env.UPLOAD_COUPONS)) {
  uploadCoupons();
}

if (Number.parseInt(process.env.DELETE_COUPONS)) {
  deleteCoupons();
}
