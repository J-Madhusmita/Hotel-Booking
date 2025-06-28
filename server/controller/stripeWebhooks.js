import Stripe from 'stripe';
import Booking from '../models/Booking.js';

export const stripeWebhooks = async (request, response) => {
  // Stripe Gateway Initialize
  console.log("🌿 Stripe Secret Key (Webhook):", process.env.STRIPE_SECRET_KEY);
  const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = request.headers['stripe-signature'];
  let event;
  
  console.log("📦 Incoming Stripe Webhook...");
  try {
    event = stripeInstance.webhooks.constructEvent(
      request.body, sig, process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log("✅ Stripe Event Constructed:", event.type);
  } catch (err) {
     console.error("❌ Webhook signature verification failed:", err.message);
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful payment event
//   if (event.type === 'payment_intent.succeeded') {
//     const paymentIntent = event.data.object;
//     const paymentIntentId = paymentIntent.id;

//     // Get session metadata
//     const session = await stripeInstance.checkout.sessions.list({
//       payment_intent: paymentIntentId,
//     });

//     const { bookingId } = session.data[0].metadata;

//     // Mark booking as paid
//     await Booking.findByIdAndUpdate(bookingId,
//       {
//         isPaid: true,
//         paymentMethod: 'Stripe',
//       }
//     );
//   } else {
//     console.log("Unhandled event type:", event.type);
//   }


if (event.type === 'checkout.session.completed') {
  const session = event.data.object;
   console.log("✅ Checkout Session Metadata:", session.metadata);
  const bookingId = session.metadata?.bookingId;

  if (bookingId) {
    const result = await Booking.findByIdAndUpdate(bookingId, {
      isPaid: true,
      paymentMethod: 'Stripe',
    });
     console.log("✅ Booking Updated in DB:", result);
    console.log(`Booking ${bookingId} marked as paid`);
  } else {
    console.warn("Booking ID not found in metadata");
  }
}


  response.json({ received: true });
};
