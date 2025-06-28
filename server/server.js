import express from "express"
import "dotenv/config";
import cors from "cors";
import connectDB from "./configs/db.js";
import { clerkMiddleware } from '@clerk/express'
import clerkWebhooks from "./controller/clerkWebhooks.js";
import userRouter from "./routes/userRoutes.js";
import hotelRouter from "./routes/hotelRoutes.js";
import {connectCloudinary} from "./configs/cloudinary.js";
import roomRouter from "./routes/roomRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import { stripeWebhooks } from "./controller/stripeWebhooks.js";

await connectDB();
connectCloudinary();

const app = express()
app.use(cors()) 

//api to listen to stripe webhooks
app.post('/api/stripe', express.raw({type: "application/json"}), stripeWebhooks)

app.post('/api/clerk',
  express.raw({ type: 'application/json' }),
  clerkWebhooks
);

// middleware
app.use(express.json())
app.use(clerkMiddleware())

// //API to listen clerkWebhooks
// app.post("/api/clerk", clerkWebhooks)

app.get('/', (req, res) => res.send("API is working fine"))

// Debug endpoint to check environment variables (remove in production)
app.get('/debug/env', (req, res) => {
  const envCheck = {
    NODE_ENV: process.env.NODE_ENV,
    STRIPE_SECRET_KEY_EXISTS: !!process.env.STRIPE_SECRET_KEY,
    STRIPE_SECRET_KEY_LENGTH: process.env.STRIPE_SECRET_KEY?.length,
    STRIPE_SECRET_KEY_PREFIX: process.env.STRIPE_SECRET_KEY?.substring(0, 10),
    STRIPE_WEBHOOK_SECRET_EXISTS: !!process.env.STRIPE_WEBHOOK_SECRET,
    MONGODB_URI_EXISTS: !!process.env.MONGODB_URI,
    CLERK_SECRET_KEY_EXISTS: !!process.env.CLERK_SECRET_KEY,
    ALL_ENV_KEYS: Object.keys(process.env).filter(key =>
      key.includes('STRIPE') || key.includes('CLERK') || key.includes('MONGODB')
    )
  };
  res.json(envCheck);
})
app.use('/api/user', userRouter)
app.use('/api/hotels', hotelRouter)
app.use('/api/rooms', roomRouter)
app.use('/api/bookings', bookingRouter)


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));