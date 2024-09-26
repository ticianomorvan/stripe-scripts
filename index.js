import fs from "node:fs"
import Stripe from "stripe"
import { parse } from "csv"

function getStripeSecretKey() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  
  if (!secretKey || secretKey.length === 0) {
    throw new Error("ERROR: STRIPE_SECRET_KEY wasn't provided")
  }

  return secretKey
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const stripe = new Stripe(getStripeSecretKey())

/**
  * Remove subscriptions matching a starting pattern.
  * Context: I had to look for customers with a "bill emoji" at the start of the string.
  * Improvements: Implement a RegExp search, not just in the name, could be in other places.
  */
async function removeSubscriptions(delimiter = ",", pattern) {
  let parser = parse({ delimiter }, async (err, data) => {
    if (err) {
      console.log(err)

      return
    }

    // Filter the subscriptions which start with [pattern].
    const subscriptionsId = data.slice(1).filter((s) => s[13].startsWith(pattern)).map((s) => s[0])
    for (const s of subscriptionsId) {
      console.log(s)
      stripe.subscriptions.cancel(s)
      await delay(100)
    }
  })
    
  fs.createReadStream(`subscriptions.csv`).pipe(parser)
}

/**
  * Remove customers matching a starting pattern.
  * Context: I had to look for customers with a "bill emoji" at the start of the string.
  * Improvements: Implement a RegExp search, not just in the name, could be in other places.
  */
async function removeCustomers(delimiter = ",", pattern) {
  let parser = parse({ delimiter }, async (err, data) => {
    if (err) {
      console.log(err)

      return
    }

    // Get customers which names starts with [pattern]
    const customersId = data.slice(1).filter((c) => c[3].startsWith(pattern)).map((c) => c[0])
    for (const c of customersId) {
      console.log(c)
      stripe.customers.del(c)
      await delay(100)
    }
  })
    
  fs.createReadStream(`unified_customers.csv`).pipe(parser)
}

if (parseInt(process.env.REMOVE_SUBSCRIPTIONS)) {
  removeSubscriptions()
}

if (parseInt(process.env.REMOVE_CUSTOMERS)) {
  removeCustomers()
}
