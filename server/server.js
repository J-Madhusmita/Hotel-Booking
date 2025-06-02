import express from "express"
import "dotenv/config";
import cors from "cors";
import connectDB from "./configs/db.js";
import { clerkMiddleware } from '@clerk/express'
import clerkWebhooks from "./controller/clerkWebhooks.js";

connectDB();

const app = express()
app.use(cors()) 

// middleware
app.use(express.json())
app.use(clerkMiddleware())

//API to listen clerkWebhooks
app.post("/api/clerk", clerkWebhooks)

app.get('/', (req, res) => res.send("API is working fine"))

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));