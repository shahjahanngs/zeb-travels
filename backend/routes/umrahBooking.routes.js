import express from "express";
import {
  createUmrahBooking,
  getAllUmrahBookings,
  getMyBookings,
  getAllBookingsAdmin,
  getUmrahBookingById,
  updateUmrahBooking,
  deleteUmrahBooking,
  submitPayment,
  reviewPayment,
  updateBookingStatus,
  updateVisaStatus, // Deprecated - kept for backwards compatibility
  updateHotelStatus, // Deprecated - kept for backwards compatibility
  // updateVoucherStatus,
  updateOverallStatus,
  savePassengerDiscounts, // Deprecated - kept for backwards compatibility
} from "../controllers/umrahBooking.controller.js";
import { protect, adminOnly } from "../middleware/auth.middleware.js";
import { uploadUmrahDoc } from "../config/cloudinary.js";

const router = express.Router();

/* ===========================
   MAIN CRUD ROUTES
=========================== */
router.post("/", protect, uploadUmrahDoc.any(), createUmrahBooking);
router.get("/", protect, getAllUmrahBookings);
router.get("/my-bookings", protect, getMyBookings);
router.get("/admin/all", protect, adminOnly, getAllBookingsAdmin);
router.get("/:id", protect, getUmrahBookingById);
router.put("/:id", protect, updateUmrahBooking);
router.delete("/:id", protect, deleteUmrahBooking);

/* ===========================
   PAYMENT ROUTES
=========================== */
// Agent/User submits payment with receipt
router.post(
  "/:id/submit-payment",
  protect,
  uploadUmrahDoc.single("receiptFile"),
  submitPayment,
);

// Admin reviews payment (update status, upload proof, or reject)
router.patch(
  "/payment/:paymentId/review",
  protect,
  adminOnly,
  uploadUmrahDoc.single("approvalProofFile"),
  reviewPayment,
);

/* ===========================
   BOOKING STATUS UPDATE ROUTE (NEW - Simplified)
=========================== */
router.patch("/:id/booking-status", protect, adminOnly, updateBookingStatus);

/* ===========================
   DEPRECATED STATUS UPDATE ROUTES (Kept for backwards compatibility)
=========================== */
router.patch(
  "/:id/visa-status",
  protect,
  adminOnly,
  uploadUmrahDoc.single("approvalDocument"),
  updateVisaStatus,
);
router.patch(
  "/:id/hotel-status",
  protect,
  adminOnly,
  uploadUmrahDoc.single("confirmationDocument"),
  updateHotelStatus,
);
// router.patch("/:id/voucher-status", protect, adminOnly, updateVoucherStatus);
router.patch("/:id/overall-status", protect, adminOnly, updateOverallStatus);

router.patch(
  "/savePassengerDiscounts",
  protect,
  adminOnly,
  savePassengerDiscounts,
);
export default router;
