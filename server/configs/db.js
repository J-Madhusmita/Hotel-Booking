import mongoose from "mongoose";

const connectDB = async () => {
    try{
        // mongoose.connection.on('connected', ()=> console.log("Database connected"));
        // await mongoose.connect(`${process.env.MONGODB_URI}/Hotel-Booking-DB`)
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    }catch(error){
        console.log(error.message);        
    }
}
export default connectDB;