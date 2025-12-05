# Stripe Quick Setup - Getting Your Keys

## ✅ What You Have

- ✅ **Publishable Key**: `pk_test_51SZvtlRtBpgD9GnqeD4wTQ5kvfmZ6WAJOCRYaTyKfucUWAn81TPGT1UIv4r7n0GoLpMKDb1Umz9wwoKovN8MxHnH007FVUrucm`
- ✅ **Product IDs**:
  - Monthly: `prod_TX022ujPnUBWrU`
  - Yearly: `prod_TX03I80Oj3hWDx`

## 🔍 What You Need

### 1. Secret Key (sk_test_...)

1. Go to https://dashboard.stripe.com/test/apikeys
2. Find **"Secret key"** (starts with `sk_test_...`)
3. Click "Reveal test key" or copy it
4. **Keep this secret!** Never commit it to git.

### 2. Price IDs (price_...)

**Important**: Price IDs are different from Product IDs!

1. Go to https://dashboard.stripe.com/test/products
2. Click on **"Drum Practice Standard (Monthly)"** (`prod_TX022ujPnUBWrU`)
3. Scroll down to **"Pricing"** section
4. You'll see a price listed (e.g., "£9.99 per month")
5. Click on that price or look for the **Price ID** (starts with `price_...`)
6. Copy the Price ID
7. Repeat for **"Drum Practice Standard (Yearly)"** (`prod_TX03I80Oj3hWDx`)

**Alternative method:**
- In the product page, look for a section showing "Prices" or "Pricing"
- The Price ID will be visible there (format: `price_xxxxxxxxxxxxx`)

### 3. Webhook Secret (for later)

You'll get this when setting up webhooks. For now, you can skip it.

---

## 📝 Environment Variables Template

Once you have all the keys, add this to your `.env.local` file:

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51SZvtlRtBpgD9GnqeD4wTQ5kvfmZ6WAJOCRYaTyKfucUWAn81TPGT1UIv4r7n0GoLpMKDb1Umz9wwoKovN8MxHnH007FVUrucm

# Stripe Price IDs
STRIPE_PRICE_ID_MONTHLY=price_YOUR_MONTHLY_PRICE_ID_HERE
STRIPE_PRICE_ID_YEARLY=price_YOUR_YEARLY_PRICE_ID_HERE

# Stripe Webhook Secret (get this later when setting up webhooks)
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🎯 Quick Checklist

- [ ] Get Secret Key from https://dashboard.stripe.com/test/apikeys
- [ ] Get Monthly Price ID from Monthly product page
- [ ] Get Yearly Price ID from Yearly product page
- [ ] Add all values to `.env.local`
- [ ] Test the pricing page at http://localhost:3000/pricing

---

## 💡 Tips

- **Price IDs** are what you use in the code (not Product IDs)
- Each product can have multiple prices (e.g., different currencies)
- Make sure you're in **Test Mode** (toggle in top right of Stripe Dashboard)
- The publishable key can be public (it's in `NEXT_PUBLIC_`)
- The secret key must stay private (never commit to git)
