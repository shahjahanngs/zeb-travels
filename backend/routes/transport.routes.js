// routes/transportRoutes.js

import express from "express";

import {
  createTransport,
  getAllTransports,
  getSingleTransport,
  updateTransport,
  deleteTransport,
} from "../controllers/transport.controller.js";

const router = express.Router();

router.post("/create", createTransport);

router.get("/all", getAllTransports);

router.get("/:id", getSingleTransport);

router.put("/update/:id", updateTransport);

router.delete("/delete/:id", deleteTransport);

export default router;
