# Stripe Live Mode Setup Guide

This guide walks you through creating live mode products in Stripe that match your test mode configuration.

## Prerequisites

- [ ] Stripe account verified for live payments
- [ ] Live mode API keys accessible
- [ ] Live webhook endpoint configured: `https://thoughtfulappco.com/api/stripe/webhook`
- [ ] Cloudflare secrets set: `STRIPE_SECRET_KEY_LIVE`, `STRIPE_WEBHOOK_SECRET_LIVE`

---

## Step 1: Switch to Live Mode

1. Go to https://dashboard.stripe.com
2. Toggle from "Test mode" to "Live mode" (top-left corner)
3. Verify you see "LIVE" badge

---

## Step 2: Create Products & Prices

Create each product below. After creating, copy the `price_xxx` ID and update the files listed.

### TACo Club

**Product: Loco TACo Club**

| Setting     | Value                                                   |
| ----------- | ------------------------------------------------------- |
| Name        | Loco TACo Club                                          |
| Description | All-access membership with 75% off extras and free sync |

**Price 1: Monthly**
| Setting | Value |
|---------|-------|
| Pricing model | Standard pricing |
| Price | $25.00 |
| Billing period | Monthly |
| Price ID | `price_xxx` -> Copy this! |

**Price 2: Lifetime**
| Setting | Value |
|---------|-------|
| Pricing model | One time |
| Price | $500.00 |
| Price ID | `price_xxx` -> Copy this! |

---

### Sync & Backup - All Apps

**Product: All Apps Sync & Backup**

| Setting     | Value                                                |
| ----------- | ---------------------------------------------------- |
| Name        | All Apps Sync & Backup                               |
| Description | Cloud backup and cross-device sync for all TACo apps |

**Price 1: Monthly**
| Setting | Value |
|---------|-------|
| Price | $3.50 |
| Billing period | Monthly |
| Price ID | `price_xxx` -> Copy this! |

**Price 2: Yearly**
| Setting | Value |
|---------|-------|
| Price | $35.00 |
| Billing period | Yearly |
| Price ID | `price_xxx` -> Copy this! |

---

### Sync & Backup - Single App

**Product: Single App Sync**

| Setting     | Value                                  |
| ----------- | -------------------------------------- |
| Name        | Single App Sync                        |
| Description | Cloud backup and sync for one TACo app |

**Price 1: Monthly**
| Setting | Value |
|---------|-------|
| Price | $2.00 |
| Billing period | Monthly |
| Price ID | `price_xxx` -> Copy this! |

**Price 2: Yearly**
| Setting | Value |
|---------|-------|
| Price | $20.00 |
| Billing period | Yearly |
| Price ID | `price_xxx` -> Copy this! |

---

### Tempo Extras

**Product: Tempo Extras**

| Setting     | Value                                      |
| ----------- | ------------------------------------------ |
| Name        | Tempo Extras                               |
| Description | AI-powered productivity features for Tempo |

**Price 1: Monthly**
| Setting | Value |
|---------|-------|
| Price | $12.00 |
| Billing period | Monthly |
| Price ID | `price_xxx` -> Copy this! |

**Price 2: Yearly**
| Setting | Value |
|---------|-------|
| Price | $120.00 |
| Billing period | Yearly |
| Price ID | `price_xxx` -> Copy this! |

---

### Tenure Extras

**Product: Tenure Extras**

| Setting     | Value                                |
| ----------- | ------------------------------------ |
| Name        | Tenure Extras                        |
| Description | AI resume mutations and career tools |

**Price 1: Monthly**
| Setting | Value |
|---------|-------|
| Price | $5.00 |
| Billing period | Monthly |
| Price ID | `price_xxx` -> Copy this! |

**Price 2: Yearly**
| Setting | Value |
|---------|-------|
| Price | $30.00 |
| Billing period | Yearly |
| Price ID | `price_xxx` -> Copy this! |

---

### Echoprax Extras

**Product: Echoprax Extras**

| Setting     | Value                                   |
| ----------- | --------------------------------------- |
| Name        | Echoprax Extras                         |
| Description | Unlimited AI-powered workout generation |

**Price 1: Monthly**
| Setting | Value |
|---------|-------|
| Price | $8.00 |
| Billing period | Monthly |
| Price ID | `price_xxx` -> Copy this! |

**Price 2: Yearly**
| Setting | Value |
|---------|-------|
| Price | $80.00 |
| Billing period | Yearly |
| Price ID | `price_xxx` -> Copy this! |

---

## Step 3: Update Code with Live Price IDs

After creating all products, update these two files with the live price IDs:

### File 1: `functions/lib/stripe.ts`

Find `STRIPE_PRICES_LIVE` and replace the placeholder values:

```typescript
export const STRIPE_PRICES_LIVE: StripePrices = {
  TACO_CLUB_MONTHLY: 'price_xxx', // Replace with live price ID
  TACO_CLUB_LIFETIME: 'price_xxx', // Replace with live price ID
  SYNC_ALL_MONTHLY: 'price_xxx', // Replace with live price ID
  SYNC_ALL_YEARLY: 'price_xxx', // Replace with live price ID
  SYNC_APP_MONTHLY: 'price_xxx', // Replace with live price ID
  SYNC_APP_YEARLY: 'price_xxx', // Replace with live price ID
  TEMPO_EXTRAS_MONTHLY: 'price_xxx', // Replace with live price ID
  TEMPO_EXTRAS_YEARLY: 'price_xxx', // Replace with live price ID
  TENURE_EXTRAS_MONTHLY: 'price_xxx', // Replace with live price ID
  TENURE_EXTRAS_YEARLY: 'price_xxx', // Replace with live price ID
  ECHOPRAX_EXTRAS_MONTHLY: 'price_xxx', // Replace with live price ID
  ECHOPRAX_EXTRAS_YEARLY: 'price_xxx', // Replace with live price ID
} as const;
```

### File 2: `src/lib/stripe-prices.ts`

Find `STRIPE_PRICES_LIVE` and replace the placeholder values (same format as above).

---

## Step 4: Verify Webhook Events

Ensure your live webhook is subscribed to these events:

- [ ] `checkout.session.completed`
- [ ] `customer.subscription.created`
- [ ] `customer.subscription.updated`
- [ ] `customer.subscription.deleted`
- [ ] `invoice.payment_succeeded`
- [ ] `invoice.payment_failed`

---

## Step 5: Deploy & Test

1. Deploy to production: `git push origin main`
2. Test with a real card (use a $1 test purchase if possible)
3. Verify webhook receives events in Stripe Dashboard
4. Check Cloudflare logs for any errors

---

## Price ID Reference

### Test Mode (Current)

| Product         | Monthly                             | Yearly/Lifetime                    |
| --------------- | ----------------------------------- | ---------------------------------- |
| TACo Club       | `price_1Sm564CPMZ8sEjvKCGmRtoZb`    | `price_1Sm564CPMZ8sEjvKRuiDExbY`   |
| Sync All        | `price_1Sm4s7CPMZ8sEjvK94OxRR1O`    | `price_1Sm4sTCPMZ8sEjvKAWdgAz3V`   |
| Sync App        | `price_1Sm5JsCPMZ8sEjvK66l5S7yG`    | `price_1Sm5JYCPMZ8sEjvKoGh2rbWj`   |
| Tempo Extras    | `price_1Sm4nYCPMZ8sEjvKbUqYoog4`    | `price_1Sm4oRCPMZ8sEjvK35pjZ6v5`   |
| Tenure Extras   | `price_1Sm4nCCPMZ8sEjvKm7zIFJ3K`    | `price_1Sm4nCCPMZ8sEjvKYLvfcZmb`   |
| Echoprax Extras | `PLACEHOLDER_ECHOPRAX_MONTHLY_TEST` | `PLACEHOLDER_ECHOPRAX_YEARLY_TEST` |

**Note:** Echoprax test mode prices need to be created in Stripe Dashboard ($8/mo and $80/year).

### Live Mode (Fill in after creating)

| Product         | Monthly           | Yearly/Lifetime   |
| --------------- | ----------------- | ----------------- |
| TACo Club       | `_______________` | `_______________` |
| Sync All        | `_______________` | `_______________` |
| Sync App        | `_______________` | `_______________` |
| Tempo Extras    | `_______________` | `_______________` |
| Tenure Extras   | `_______________` | `_______________` |
| Echoprax Extras | `_______________` | `_______________` |

---

## Troubleshooting

### Webhook not receiving events

1. Check webhook signing secret matches `STRIPE_WEBHOOK_SECRET_LIVE`
2. Verify endpoint URL is exactly `https://thoughtfulappco.com/api/stripe/webhook`
3. Check Cloudflare Pages deployment is live

### "Invalid API Key" errors

1. Verify `STRIPE_SECRET_KEY_LIVE` is set correctly
2. Ensure it starts with `sk_live_` (not `sk_test_`)
3. Check Cloudflare secrets were saved correctly

### Price ID not found

1. Ensure you copied the full price ID (starts with `price_`)
2. Verify product was created in LIVE mode (not test mode)
3. Check the price is active (not archived)
