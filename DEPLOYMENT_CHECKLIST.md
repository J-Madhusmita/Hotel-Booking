# Stripe Payment Deployment Checklist

## Issue Identified
Your Stripe payment works locally but fails in production with "neither api key nor auth provided" error.

## Root Causes
1. **Environment Variables**: Stripe secret key might not be properly loaded in Render
2. **Frontend Configuration**: Frontend pointing to localhost instead of production backend
3. **Missing Error Handling**: No validation for environment variables

## Fixes Applied

### 1. Enhanced Error Handling
- Added comprehensive environment variable validation in `stripePayment` function
- Added debugging logs to identify missing variables
- Added validation for Stripe key format (must start with 'sk_')

### 2. Frontend Configuration
- Updated `client/.env` to point to production backend URL
- Changed from `http://localhost:3000` to `https://hotel-booking-o2as.onrender.com`

### 3. Webhook Validation
- Enhanced Stripe webhook validation
- Added checks for both secret key and webhook secret

## Steps to Fix in Render

### 1. Verify Environment Variables in Render Dashboard
Go to your Render service dashboard and ensure these variables are set:

```
STRIPE_SECRET_KEY=sk_test_[YOUR_STRIPE_SECRET_KEY_FROM_LOCAL_ENV]
STRIPE_WEBHOOK_SECRET=whsec_[YOUR_WEBHOOK_SECRET_FROM_LOCAL_ENV]
```

**Important**: Copy the exact values from your local `server/.env` file - do not use the placeholder values above.

### 2. Check Environment Variable Format
- Ensure no extra spaces before/after the values
- Ensure no quotes around the values in Render
- Verify the keys are exactly as shown above

### 3. Redeploy After Setting Variables
- After updating environment variables in Render, trigger a new deployment
- Environment variables are only loaded during deployment

### 4. Test Environment Variables
Run this command in your Render service to check if variables are loaded:
```bash
node server/scripts/check-env.js
```

## Debugging Steps

### 1. Check Render Logs
Look for these log messages in your Render deployment logs:
- "✅ Environment check:"
- "❌ STRIPE_SECRET_KEY is not defined"
- "✅ Initializing Stripe with secret key..."

### 2. Test API Endpoint
Test the stripe payment endpoint directly:
```bash
curl -X POST https://hotel-booking-o2as.onrender.com/api/bookings/stripe-payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"bookingId": "BOOKING_ID"}'
```

### 3. Frontend Deployment
After updating the frontend `.env` file:
1. Redeploy your Vercel frontend
2. Ensure the new backend URL is being used

## Common Issues and Solutions

### Issue: "Invalid API Key"
**Solution**: Ensure the Stripe secret key starts with `sk_` and has no extra characters

### Issue: "Webhook signature verification failed"
**Solution**: Ensure `STRIPE_WEBHOOK_SECRET` is set correctly in Render and starts with `whsec_`

### Issue: "CORS Error"
**Solution**: Ensure your frontend is pointing to the correct backend URL

### Issue: "Environment variable not found"
**Solution**: 
1. Check spelling of environment variable names
2. Ensure no extra spaces in Render dashboard
3. Redeploy after setting variables

## Testing Checklist

- [ ] Environment variables are set in Render dashboard
- [ ] Backend deployment shows successful environment variable loading
- [ ] Frontend is pointing to production backend URL
- [ ] Stripe payment creates session successfully
- [ ] Webhook receives and processes payment events
- [ ] Booking status updates correctly after payment

## Next Steps

1. **Update Render Environment Variables**: Copy the exact values from your local `.env` file
2. **Redeploy Backend**: Trigger a new deployment in Render
3. **Update Frontend**: Redeploy Vercel with the updated backend URL
4. **Test Payment Flow**: Try making a test payment
5. **Monitor Logs**: Check Render logs for any remaining issues

## Support

If issues persist, check:
1. Render service logs for detailed error messages
2. Stripe dashboard for webhook delivery status
3. Browser network tab for API call responses
