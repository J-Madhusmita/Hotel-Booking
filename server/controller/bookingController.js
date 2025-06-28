import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import Hotel from "../models/Hotel.js";
import transporter from "../configs/nodemailer.js";
import Stripe from "stripe";

// Function to check if a room is available for the given dates
// Function to check room availability
const checkAvailability = async ({ checkInDate, checkOutDate, room }) => {
  try {
    const bookings = await Booking.find({
      room,
      checkInDate: { $lte: checkOutDate },
      checkOutDate: { $gte: checkInDate },
    });

    const isAvailable = bookings.length === 0;
    return isAvailable;

  } catch (error) {
    console.error(error.message);
  }
};

// API to check availability of room
// POST /api/bookings/check-availability
export const checkAvailabilityAPI = async (req, res) => {
    try {      
        const {room, checkInDate, checkOutDate} =req.body;
        const isAvailable = await checkAvailability({room, checkInDate, checkOutDate});

        res.json({success: true,  isAvailable});

    } catch (error) {
        res.json({success: false, message: error.message});
    }
}

// API to create new booking
// POST /api/bookings/book
export const createBooking = async (req, res) => {
    try {      
        const {room, checkInDate, checkOutDate, guests} =req.body;
        const user = req.user._id;
        //before booking check availibility
        const isAvailable = await checkAvailability({room, checkInDate, checkOutDate});
        if(!isAvailable){
            return res.json({success: true,  message: "Room is not available"});
        }

        //get total price from room
        const roomData = await Room.findById(room).populate("hotel");
        let totalPrice = roomData.pricePerNight;
        //calculate total price based on nightd
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        const timeDiff = checkOut.getTime() - checkIn.getTime();
        const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));

        totalPrice *= nights;

        const booking = await Booking.create({
            user,
            room,
            hotel: roomData.hotel._id,
            guests: +guests,
            checkInDate,
            checkOutDate,
            totalPrice,           
        })

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: req.user.email,
            subject: 'Hotel Booking Details',
            html: `
            <h2>Your Booking Details</h2>
            <p>Dear ${req.user.username},</p>
            <p>Thank you for your booking! Here are your details:</p>
            <ul>
                <li><strong>Booking ID:</strong> ${booking._id}</li>
                <li><strong>Hotel Name:</strong> ${roomData.hotel.name}</li>
                <li><strong>Location:</strong> ${roomData.hotel.address}</li>
                <li><strong>Date:</strong> ${booking.checkInDate.toDateString()}</li>
                <li><strong>Booking Amount:</strong> ${process.env.CURRENCY || '$'} ${booking.totalPrice} /night</li>
            </ul>
            <p>We look forward to welcoming you!</p>
            <p>If you need to make any changes, feel free to contact us.</p>            `

        }

        await transporter.sendMail(mailOptions)

        res.json({success: true,  message: "Booking created successfully"});

    } catch (error) {
        console.log(error);        
        res.json({success: false, message: error.message});
    }
}

// API to get all booking for a user
// POST /api/bookings/user
export const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("room hotel")  // populate room and hotel details
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    res.json({ success: false, message: "Failed to fetch bookings" });
  }
};

export const getHotelBookings = async (req, res) => {
    try {
        const hotel = await Hotel.findOne({ owner: req.auth.userId });

        if (!hotel) {
            return res.json({ success: false, message: "No Hotel found" });
        }

        const bookings = await Booking.find({ hotel: hotel._id })
            .populate("room hotel user")
            .sort({ createdAt: -1 });

        // Total Bookings
        const totalBookings = bookings.length;

        // Total Revenue
        const totalRevenue = bookings.reduce((acc, booking) => acc + booking.totalPrice,0);

        res.json({success: true, dashboardData: {
                totalBookings, totalRevenue, bookings
            }
        });

    } catch (error) {
            res.json({success: false, message: "Failed to fetch bookings"});
    }
};


export const stripePayment = async (req, res) => {
  console.log("✅ stripePayment API called");
  console.log("✅ Environment check:");
  console.log("- NODE_ENV:", process.env.NODE_ENV);
  console.log("- All env keys containing STRIPE:", Object.keys(process.env).filter(k => k.includes('STRIPE')));
  console.log("- STRIPE_SECRET_KEY exists:", !!process.env.STRIPE_SECRET_KEY);
  console.log("- STRIPE_SECRET_KEY length:", process.env.STRIPE_SECRET_KEY?.length);
  console.log("- STRIPE_SECRET_KEY starts with:", process.env.STRIPE_SECRET_KEY?.substring(0, 10));
  console.log("- Raw STRIPE_SECRET_KEY (first 20 chars):", JSON.stringify(process.env.STRIPE_SECRET_KEY?.substring(0, 20)));

  // Try to reload environment variables (Render workaround)
  if (!process.env.STRIPE_SECRET_KEY) {
    console.log("🔄 Attempting to reload environment variables...");
    try {
      // Force reload dotenv in case Render has loading issues
      const dotenv = await import('dotenv');
      dotenv.config();
      console.log("- After reload - STRIPE_SECRET_KEY exists:", !!process.env.STRIPE_SECRET_KEY);
    } catch (error) {
      console.log("- Dotenv reload failed:", error.message);
    }
  }

  // Validate Stripe secret key
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("❌ STRIPE_SECRET_KEY is not defined in environment variables");
    console.error("❌ Available env vars:", Object.keys(process.env).slice(0, 10));
    return res.json({
      success: false,
      message: "Stripe configuration error: Secret key not found. Please check Render environment variables."
    });
  }

  if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    console.error("❌ STRIPE_SECRET_KEY appears to be invalid (should start with 'sk_')");
    console.error("❌ Current value starts with:", process.env.STRIPE_SECRET_KEY.substring(0, 5));
    return res.json({
      success: false,
      message: "Stripe configuration error: Invalid secret key format"
    });
  }

  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    const roomData = await Room.findById(booking.room).populate("hotel");
    const totalPrice = booking.totalPrice;
    const { origin } = req.headers;

    console.log("✅ Initializing Stripe with secret key...");
    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

    const line_items = [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: roomData.hotel.name,
          },
          unit_amount: totalPrice * 100,
        },
        quantity: 1,
      },
    ];

    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${origin}/loader/my-bookings`,
      cancel_url: `${origin}/my-bookings`,
      metadata:{
        bookingId,
      }
    });

    console.log("session------------", session);

    res.json({ success: true, url: session.url });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};


