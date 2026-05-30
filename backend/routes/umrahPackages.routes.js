import express from "express";
import { upload } from "../config/cloudinary.js";
import {
  getAllPackages,
  getPackageById,
  updatePackage,
  deletePackage,
  createPackages,
} from "../controllers/umrahPackge.controller.js";

const router = express.Router();

// CRUD routes
router.post(
  "/",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "flightLogo", maxCount: 1 },
  ]),
  createPackages,
);

router.get("/", getAllPackages);
router.get("/:id", getPackageById);

router.put(
  "/:id",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "flightLogo", maxCount: 1 },
  ]),
  updatePackage,
);

router.delete("/:id", deletePackage);

export default router;
