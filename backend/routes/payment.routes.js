import express from "express";
import { upload } from "../config/cloudinary.js";
import {
  createPayment,
  getPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
  getLedgerByUser,
  exportLedgerCSV,
  exportLedgerExcel,
  exportLedgerPDF,
  getZipLedgerByUser,
  getBankLedger,
} from "../controllers/payment.controller.js";

const router = express.Router();

// Create new payment (with receipt upload)
router.post("/add", upload.single("receipt"), createPayment);

// Get all payments (with optional filters)
router.get("/", getPayments);

// Get ledger for a specific user
router.get("/ledger/:userId", getLedgerByUser);

// Get ZIP Accounts ledger for a specific user (journalPortal vouchers)
router.get("/zip-ledger/:userId", getZipLedgerByUser);

// Export ledger in different formats
router.get("/ledger/:userId/export/csv", exportLedgerCSV);
router.get("/ledger/:userId/export/excel", exportLedgerExcel);
router.get("/ledger/:userId/export/pdf", exportLedgerPDF);

// Get single payment by ID
router.get("/:id", getPaymentById);

// Update payment (with optional receipt upload)
router.put("/:id", upload.single("receipt"), updatePayment);

// Delete payment
router.delete("/:id", deletePayment);

// Get bank ledger — all approved payments for a specific bank
router.get("/bank-ledger/:bankId", getBankLedger);

export default router;
