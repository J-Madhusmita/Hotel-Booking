import User from "../models/User.js";

//Middleware to check if user authenticated
export const protect = async(req, res, next)=>{
    const {userId} = req.auth;
    if(!userId){
        return res.json({success: false, message: "not authenticated"})
    }else{
        const user = await User.findById(userId);
        req.user = user;
        next();
    }
}