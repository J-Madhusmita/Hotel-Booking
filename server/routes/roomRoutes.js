import express from "express"
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import { createRoom, getOwnerRooms, getRooms, toggleRoomAvailability } from "../controller/roomController.js";

const roomRouter = express.Router();

roomRouter.post('/', upload.array("images", 4), protect, createRoom); 
roomRouter.get('/', getRooms);
roomRouter.get('/owner', protect, getOwnerRooms);
roomRouter.post('/toggle-availibility', protect, toggleRoomAvailability);

export default roomRouter;