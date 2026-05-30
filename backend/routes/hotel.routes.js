// routes/hotelRoutes.js

import express from "express";

import {
  createHotel,
  getAllHotels,
  getSingleHotel,
  updateHotel,
  deleteHotel,
} from "../controllers/hotel.controller.js";

const router = express.Router();

router.post("/create", createHotel);

router.get("/all", getAllHotels);

router.get("/:id", getSingleHotel);

router.put("/update/:id", updateHotel);

router.delete("/delete/:id", deleteHotel);

export default router;
