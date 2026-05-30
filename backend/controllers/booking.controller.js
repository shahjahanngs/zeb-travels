// import Booking from "../models/Booking.js";
// import GroupTicketing from "../models/GroupTicketing.js";
// import mongoose from "mongoose";

// const HOLD_DURATION = 2 * 60 * 60 * 1000; // 2 hours

// // const adjustSeatsIfLocalGroup = async (groupId, seatChange, session, checkAvailability = false) => {
// //   if (!mongoose.Types.ObjectId.isValid(groupId)) return; // External group → ignore

// //   const query = { _id: groupId };

// //   if (checkAvailability && seatChange < 0) {
// //     query.totalSeats = { $gte: Math.abs(seatChange) };
// //   }

// //   const result = await GroupTicketing.updateOne(
// //     query,
// //     { $inc: { totalSeats: seatChange } },
// //     { session }
// //   );

// //   if (result.matchedCount === 0) return; // Not stored locally → ignore
// //   if (checkAvailability && result.modifiedCount === 0)
// //     throw new Error("Not enough seats available");
// // };

// const adjustSeatsIfLocalGroup = async (groupId, seatChange, checkAvailability = false) => {
//   if (!mongoose.Types.ObjectId.isValid(groupId)) return; // External group

//   const query = { _id: groupId };

//   if (checkAvailability && seatChange < 0) {
//     query.totalSeats = { $gte: Math.abs(seatChange) };
//   }

//   const result = await GroupTicketing.updateOne(query, {
//     $inc: { totalSeats: seatChange }
//   });

//   if (result.matchedCount === 0) return; // Not local
//   if (checkAvailability && result.modifiedCount === 0)
//     throw new Error("Not enough seats available");
// };

// /* =========================================================
//    CREATE BOOKING
// ========================================================= */
// // export const createBooking = async (req, res) => {
// //   const session = await mongoose.startSession();
// //   session.startTransaction();

// //   try {
// //     const {
// //       groupId, groupType, airline, sector, pnr, contactPersonName,
// //       adultsCount, childrenCount, infantsCount, totalPassengers,
// //       pricing, passengers, flights, departureDate, arrivalDate
// //     } = req.body;

// //     if (passengers.length !== totalPassengers)
// //       throw new Error("Passenger mismatch");

// //     const calculatedTotal =
// //       pricing.adultTotal + pricing.childTotal + pricing.infantTotal;

// //     if (Math.abs(calculatedTotal - pricing.grandTotal) > 0.01)
// //       throw new Error("Price mismatch");

// //     const seatCount = adultsCount + childrenCount;
// //     const expiresAt = new Date(Date.now() + HOLD_DURATION);

// //     // Reduce seats ONLY if local group
// //     await adjustSeatsIfLocalGroup(groupId, -seatCount, session, true);

// //     const [booking] = await Booking.create([{
// //       groupId, groupType, airline, sector, pnr, contactPersonName,
// //       adultsCount, childrenCount, infantsCount, totalPassengers,
// //       pricing, passengers, flights, departureDate, arrivalDate,
// //       userId: req.user._id,
// //       status: "on hold",
// //       expiresAt
// //     }], { session });

// //     await session.commitTransaction();
// //     session.endSession();

// //     res.status(201).json({ success: true, data: booking });

// //   } catch (err) {
// //     await session.abortTransaction();
// //     session.endSession();
// //     res.status(400).json({ success: false, message: err.message });
// //   }
// // };

// export const createBooking = async (req, res) => {
//   let seatCount = 0;
//   let booking = null;

//   try {
//     const {
//       groupId, groupType, airline, sector, pnr, contactPersonName,
//       adultsCount, childrenCount, infantsCount, totalPassengers,
//       pricing, passengers, flights, departureDate, arrivalDate
//     } = req.body;

//     if (passengers.length !== totalPassengers)
//       throw new Error("Passenger mismatch");

//     const calculatedTotal =
//       pricing.adultTotal + pricing.childTotal + pricing.infantTotal;

//     if (Math.abs(calculatedTotal - pricing.grandTotal) > 0.01)
//       throw new Error("Price mismatch");

//     seatCount = adultsCount + childrenCount;
//     const expiresAt = new Date(Date.now() + HOLD_DURATION);

//     // STEP 1 — Deduct seats safely
//     await adjustSeatsIfLocalGroup(groupId, -seatCount, true);

//     // STEP 2 — Create booking
//     booking = await Booking.create({
//       groupId, groupType, airline, sector, pnr, contactPersonName,
//       adultsCount, childrenCount, infantsCount, totalPassengers,
//       pricing, passengers, flights, departureDate, arrivalDate,
//       userId: req.user._id,
//       status: "on hold",
//       expiresAt
//     });

//     res.status(201).json({ success: true, data: booking });

//   } catch (err) {
//     // ROLLBACK seats if booking failed AFTER deduction
//     if (seatCount > 0) {
//       await adjustSeatsIfLocalGroup(req.body.groupId, seatCount).catch(() => { });
//     }

//     res.status(400).json({ success: false, message: err.message });
//   }
// };

// /* =========================================================
//    GET ALL BOOKINGS
// ========================================================= */
// export const getAllBookings = async (req, res) => {
//   try {
//     const { page = 1, limit = 10, status, sector, airline, fromDate, search } = req.query;
//     const query = {};

//     if (status) query.status = status;
//     if (sector) query.sector = sector;
//     if (airline) query["airline.name"] = airline;
//     if (fromDate) query.departureDate = { $gte: new Date(fromDate) };

//     if (search) {
//       query.$or = [
//         { bookingReference: { $regex: search, $options: "i" } },
//         { contactPersonName: { $regex: search, $options: "i" } },
//         { pnr: { $regex: search, $options: "i" } }
//       ];
//     }

//     if (req.user.role !== "Admin") query.userId = req.user._id;

//     const skip = (page - 1) * limit;

//     const bookings = await Booking.find(query)
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(Number(limit))
//       .populate("userId", "name email agencyCode companyName");

//     const total = await Booking.countDocuments(query);

//     res.json({
//       success: true,
//       data: bookings,
//       pagination: {
//         currentPage: Number(page),
//         totalPages: Math.ceil(total / limit),
//         totalBookings: total
//       }
//     });
//   } catch (err) {
//     res.status(500).json({ success: false, message: "Failed to fetch bookings" });
//   }
// };

// /* =========================================================
//    GET BOOKING BY ID
// ========================================================= */
// export const getBookingById = async (req, res) => {
//   try {
//     const booking = await Booking.findById(req.params.id)
//       .populate("userId", "name email agencyCode companyName");

//     if (!booking)
//       return res.status(404).json({ success: false, message: "Booking not found" });

//     if (req.user.role !== "Admin" && booking.userId._id.toString() !== req.user._id.toString())
//       return res.status(403).json({ success: false, message: "Not authorized" });

//     res.json({ success: true, data: booking });
//   } catch {
//     res.status(500).json({ success: false, message: "Failed to fetch booking" });
//   }
// };

// /* =========================================================
//    GET BOOKING BY REFERENCE
// ========================================================= */
// export const getBookingByReference = async (req, res) => {
//   try {
//     const booking = await Booking.findOne({ bookingReference: req.params.reference })
//       .populate("userId", "name email agencyCode companyName");

//     if (!booking)
//       return res.status(404).json({ success: false, message: "Booking not found" });

//     if (req.user.role !== "Admin" && booking.userId._id.toString() !== req.user._id.toString())
//       return res.status(403).json({ success: false, message: "Not authorized" });

//     res.json({ success: true, data: booking });
//   } catch {
//     res.status(500).json({ success: false, message: "Failed to fetch booking" });
//   }
// };

// // export const updateBookingStatus = async (req, res) => {
// //   const session = await mongoose.startSession();
// //   session.startTransaction();

// //   try {
// //     const { status, notes } = req.body;
// //     const booking = await Booking.findById(req.params.id).session(session);
// //     if (!booking) throw new Error("Booking not found");

// //     const oldStatus = booking.status;
// //     const seats = booking.adultsCount + booking.childrenCount;

// //     if (oldStatus !== "cancelled" && status === "cancelled") {
// //       await adjustSeatsIfLocalGroup(booking.groupId, seats, session);
// //     }

// //     if (oldStatus === "cancelled" && status !== "cancelled") {
// //       await adjustSeatsIfLocalGroup(booking.groupId, -seats, session, true);
// //     }

// //     booking.status = status;
// //     booking.notes = notes ?? booking.notes;
// //     booking.expiresAt = status === "on hold"
// //       ? new Date(Date.now() + HOLD_DURATION)
// //       : null;

// //     await booking.save({ session });

// //     await session.commitTransaction();
// //     session.endSession();

// //     res.json({ success: true, data: booking });

// //   } catch (err) {
// //     await session.abortTransaction();
// //     session.endSession();
// //     res.status(400).json({ success: false, message: err.message });
// //   }
// // };

// export const updateBookingStatus = async (req, res) => {
//   try {
//     const { status, notes } = req.body;
//     const booking = await Booking.findById(req.params.id);
//     if (!booking) throw new Error("Booking not found");

//     const oldStatus = booking.status;
//     const seats = booking.adultsCount + booking.childrenCount;

//     // Restore seats if cancelling
//     if (oldStatus !== "cancelled" && status === "cancelled") {
//       await adjustSeatsIfLocalGroup(booking.groupId, seats);
//     }

//     // Deduct seats if reactivating
//     if (oldStatus === "cancelled" && status !== "cancelled") {
//       await adjustSeatsIfLocalGroup(booking.groupId, -seats, true);
//     }

//     booking.status = status;
//     booking.notes = notes ?? booking.notes;
//     booking.expiresAt = status === "on hold"
//       ? new Date(Date.now() + HOLD_DURATION)
//       : null;

//     await booking.save();

//     res.json({ success: true, data: booking });

//   } catch (err) {
//     res.status(400).json({ success: false, message: err.message });
//   }
// };

// /* =========================================================
//    UPDATE BOOKING DETAILS
// ========================================================= */
// // export const updateBooking = async (req, res) => {
// //   const session = await mongoose.startSession();
// //   session.startTransaction();

// //   try {
// //     const booking = await Booking.findById(req.params.id).session(session);
// //     if (!booking) throw new Error("Booking not found");

// //     if (booking.status !== "on hold")
// //       throw new Error("Only on-hold bookings can be edited");

// //     const oldSeats = booking.adultsCount + booking.childrenCount;

// //     Object.assign(booking, req.body);

// //     const newSeats = booking.adultsCount + booking.childrenCount;
// //     const diff = newSeats - oldSeats;

// //     if (diff !== 0) {
// //       await adjustSeatsIfLocalGroup(booking.groupId, -diff, session, diff > 0);
// //     }

// //     booking.expiresAt = booking.status === "on hold"
// //       ? new Date(Date.now() + HOLD_DURATION)
// //       : null;

// //     await booking.save({ session });

// //     await session.commitTransaction();
// //     session.endSession();

// //     res.json({ success: true, data: booking });

// //   } catch (err) {
// //     await session.abortTransaction();
// //     session.endSession();
// //     res.status(400).json({ success: false, message: err.message });
// //   }
// // };

// export const updateBooking = async (req, res) => {
//   try {
//     const booking = await Booking.findById(req.params.id);
//     if (!booking) throw new Error("Booking not found");
//     if (booking.status !== "on hold")
//       throw new Error("Only on-hold bookings can be edited");

//     const oldSeats = booking.adultsCount + booking.childrenCount;

//     Object.assign(booking, req.body);

//     const newSeats = booking.adultsCount + booking.childrenCount;
//     const diff = newSeats - oldSeats;

//     if (diff > 0) {
//       await adjustSeatsIfLocalGroup(booking.groupId, -diff, true);
//     } else if (diff < 0) {
//       await adjustSeatsIfLocalGroup(booking.groupId, Math.abs(diff));
//     }

//     booking.expiresAt = booking.status === "on hold"
//       ? new Date(Date.now() + HOLD_DURATION)
//       : null;
//     await booking.save();

//     res.json({ success: true, data: booking });

//   } catch (err) {
//     res.status(400).json({ success: false, message: err.message });
//   }
// };

// /* =========================================================
//    CANCEL BOOKING
// ========================================================= */
// // export const cancelBooking = async (req, res) => {
// //   const session = await mongoose.startSession();
// //   session.startTransaction();

// //   try {
// //     const booking = await Booking.findById(req.params.id).session(session);
// //     if (!booking) throw new Error("Booking not found");
// //     if (booking.status === "cancelled") throw new Error("Already cancelled");

// //     const seats = booking.adultsCount + booking.childrenCount;

// //     booking.status = "cancelled";
// //     booking.expiresAt = null;
// //     await booking.save({ session });

// //     await adjustSeatsIfLocalGroup(booking.groupId, seats, session);

// //     await session.commitTransaction();
// //     session.endSession();

// //     res.json({ success: true, message: "Booking cancelled", data: booking });

// //   } catch (err) {
// //     await session.abortTransaction();
// //     session.endSession();
// //     res.status(400).json({ success: false, message: err.message });
// //   }
// // };

// export const cancelBooking = async (req, res) => {
//   try {
//     const booking = await Booking.findById(req.params.id);
//     if (!booking) throw new Error("Booking not found");
//     if (booking.status === "cancelled") throw new Error("Already cancelled");

//     const seats = booking.adultsCount + booking.childrenCount;

//     booking.status = "cancelled";
//     booking.expiresAt = null;
//     await booking.save();

//     await adjustSeatsIfLocalGroup(booking.groupId, seats);

//     res.json({ success: true, message: "Booking cancelled", data: booking });

//   } catch (err) {
//     res.status(400).json({ success: false, message: err.message });
//   }
// };

// /* =========================================================
//    DELETE BOOKING (ADMIN ONLY)
// ========================================================= */
// // export const deleteBooking = async (req, res) => {
// //   const session = await mongoose.startSession();
// //   session.startTransaction();

// //   try {
// //     if (req.user.role !== "Admin") throw new Error("Not authorized");

// //     const booking = await Booking.findById(req.params.id).session(session);
// //     if (!booking) throw new Error("Booking not found");

// //     if (booking.status !== "cancelled") {
// //       const seats = booking.adultsCount + booking.childrenCount;
// //       await adjustSeatsIfLocalGroup(booking.groupId, seats, session);
// //     }

// //     await booking.deleteOne({ session });

// //     await session.commitTransaction();
// //     session.endSession();

// //     res.json({ success: true, message: "Booking deleted" });

// //   } catch (err) {
// //     await session.abortTransaction();
// //     session.endSession();
// //     res.status(400).json({ success: false, message: err.message });
// //   }
// // };

// export const deleteBooking = async (req, res) => {
//   try {
//     // if (req.user.role !== "Admin")
//     //   throw new Error("Not authorized");

//     const booking = await Booking.findById(req.params.id);
//     if (!booking) throw new Error("Booking not found");

//     if (booking.status !== "cancelled") {
//       const seats = booking.adultsCount + booking.childrenCount;
//       await adjustSeatsIfLocalGroup(booking.groupId, seats);
//     }

//     await booking.deleteOne();

//     res.json({ success: true, message: "Booking deleted" });

//   } catch (err) {
//     res.status(400).json({ success: false, message: err.message });
//   }
// };

// /* =========================================================
//    BOOKING STATISTICS (ADMIN DASHBOARD)
// ========================================================= */
// export const getBookingStatistics = async (req, res) => {
//   try {
//     const stats = await Booking.aggregate([
//       {
//         $group: {
//           _id: "$status",
//           count: { $sum: 1 },
//           revenue: { $sum: "$pricing.grandTotal" }
//         }
//       }
//     ]);

//     const totalBookings = await Booking.countDocuments();
//     const totalRevenue = await Booking.aggregate([
//       { $group: { _id: null, total: { $sum: "$pricing.grandTotal" } } }
//     ]);

//     res.json({
//       success: true,
//       data: {
//         byStatus: stats,
//         totalBookings,
//         totalRevenue: totalRevenue[0]?.total || 0
//       }
//     });
//   } catch {
//     res.status(500).json({ success: false, message: "Failed to fetch statistics" });
//   }
// };

import Booking from "../models/Booking.js";
import GroupTicketing from "../models/GroupTicketing.js";
import mongoose from "mongoose";
import Register from "../models/Register.js";
import axios from "axios";
import { deductSeatsFromCache } from "../utils/cacheHelpers.js";
import { createSabaoonBooking } from "./sabaoon.controller.js";
// import zipAccountsService from "../services/zipAccounts.service.js";

const HOLD_DURATION = 30 * 60 * 1000; // 30 minutes

// -------------------------
// Helper Functions
// -------------------------
const isLocalGroup = (groupId) => mongoose.Types.ObjectId.isValid(groupId);
const normalizeGroupId = (groupId) => groupId?.toString();

// Adjust seats only for local groups
const adjustSeatsIfLocalGroup = async (
  groupId,
  seatChange,
  checkAvailability = false,
) => {
  if (!isLocalGroup(groupId)) return; // External group → ignore

  const query = { _id: groupId };
  if (checkAvailability && seatChange < 0)
    query.totalSeats = { $gte: Math.abs(seatChange) };

  const result = await GroupTicketing.updateOne(query, {
    $inc: { totalSeats: seatChange },
  });

  if (result.matchedCount === 0) return; // Not local → ignore
  if (checkAvailability && result.modifiedCount === 0)
    throw new Error("Not enough seats available");
};

// -------------------------
// CREATE BOOKING
// -------------------------
export const createBooking = async (req, res) => {
  let seatCount = 0;
  let booking = null;

  try {
    const {
      groupId: incomingGroupId,
      groupType,
      airline,
      sector,
      pnr,
      contactPersonName,
      adultsCount,
      childrenCount,
      infantsCount,
      totalPassengers,
      pricing,
      passengers,
      flights,
      departureDate,
      arrivalDate,
    } = req.body;

    if (passengers.length !== totalPassengers)
      throw new Error("Passenger mismatch");

    const calculatedTotal =
      pricing.adultTotal + pricing.childTotal + pricing.infantTotal;
    if (Math.abs(calculatedTotal - pricing.grandTotal) > 0.01)
      throw new Error("Price mismatch");

    seatCount = adultsCount + childrenCount;
    const expiresAt = new Date(Date.now() + HOLD_DURATION);
    const groupId = normalizeGroupId(incomingGroupId);

    // Sabaoon groups have numeric string IDs (e.g. "968"), not MongoDB ObjectIds
    const isSabaoonGroup = !isLocalGroup(groupId);

    // 1️⃣ Deduct from local DB (existing logic)
    await adjustSeatsIfLocalGroup(groupId, -seatCount, true);

    // 2️⃣ Deduct from unified cache too
    await deductSeatsFromCache(groupId, seatCount);

    booking = await Booking.create({
      groupId,
      groupType,
      airline,
      sector,
      pnr,
      contactPersonName,
      adultsCount,
      childrenCount,
      infantsCount,
      totalPassengers,
      pricing,
      passengers,
      flights,
      departureDate,
      arrivalDate,
      userId: req.user._id,
      status: "on hold",
      expiresAt,
      sabaoonBookingStatus: isSabaoonGroup ? "pending" : "not_applicable",
      supplierName: isSabaoonGroup
        ? "Sabaoon"
        : "ZEB Travels & Traders Pvt Ltd",
    });

    // ─── Call Sabaoon booking API for external (Sabaoon) groups ───
    if (isSabaoonGroup) {
      try {
        const { transactionId } = await createSabaoonBooking({
          groupId,
          pnr,
          bookingReference: booking.bookingReference,
          adultsCount,
          childrenCount,
          infantsCount,
          passengers,
          pricing,
        });

        booking.sabaoonTransactionId = transactionId;
        booking.sabaoonBookingStatus = "success";
        await booking.save();
        console.log(
          `Sabaoon booking created — transaction_id: ${transactionId}`,
        );
      } catch (sabaoonErr) {
        console.error("Sabaoon booking API failed:", sabaoonErr.message);
        booking.sabaoonBookingStatus = "failed";
        await booking.save();
        // We still return success to the user — local booking is saved.
        // The admin can retry / reconcile manually.
      }
    }

    res.status(201).json({ success: true, data: booking });
  } catch (err) {
    // Rollback local DB seats
    if (seatCount > 0) {
      await adjustSeatsIfLocalGroup(
        normalizeGroupId(req.body.groupId),
        seatCount,
      ).catch(() => {});

      // Rollback cache seats too
      await deductSeatsFromCache(
        normalizeGroupId(req.body.groupId),
        -seatCount, // negative = add back
      ).catch(() => {});
    }
    res.status(400).json({ success: false, message: err.message });
  }
};

// -------------------------
// GET ALL BOOKINGS
// -------------------------
export const getAllBookings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      sector,
      airline,
      fromDate,
      search,
    } = req.query;
    const query = {};

    if (status) query.status = status;
    if (sector) query.sector = sector;
    if (airline) query["airline.name"] = airline;
    if (fromDate) query.departureDate = { $gte: new Date(fromDate) };

    if (search) {
      query.$or = [
        { bookingReference: { $regex: search, $options: "i" } },
        { contactPersonName: { $regex: search, $options: "i" } },
        { pnr: { $regex: search, $options: "i" } },
      ];
    }

    if (req.user.role !== "Admin") query.userId = req.user._id;

    const skip = (page - 1) * limit;

    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("userId", "name email agencyCode companyName phone");

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        totalBookings: total,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch bookings" });
  }
};

// -------------------------
// GET BOOKING BY ID
// -------------------------
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate(
      "userId",
      "name email agencyCode companyName",
    );

    if (!booking)
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });

    if (
      req.user.role !== "Admin" &&
      booking.userId._id.toString() !== req.user._id.toString()
    )
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });

    res.json({ success: true, data: booking });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch booking" });
  }
};

// -------------------------
// GET BOOKING BY REFERENCE
// -------------------------
export const getBookingByReference = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      bookingReference: req.params.reference,
    }).populate("userId", "name email agencyCode companyName");

    if (!booking)
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });

    if (
      req.user.role !== "Admin" &&
      booking.userId._id.toString() !== req.user._id.toString()
    )
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });

    res.json({ success: true, data: booking });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch booking" });
  }
};

// -------------------------
// UPDATE BOOKING STATUS
// -------------------------

// const ledgerHiting = async (booking, groupTKT) => {
//   // console.log("Group Ticket Data:", groupTKT);
//   // console.log("Booking Data:", booking);

//   // Fetch all accounts from ZIP Accounts API
//   const accountsData = await zipAccountsService.getAllAccounts();
//   const accounts = Array.isArray(accountsData)
//     ? accountsData
//     : accountsData.results || [];

//   // Resolve the agent's (customer) company name
//   const agentUser = await Register.findById(booking.userId);
//   const agentName = agentUser?.companyName;

//   // Resolve the correct supplier name from groupTKT
//   const supplierName = groupTKT?.supplierName;

//   // Find the required account IDs
//   let customerAccount = "";
//   let supplierAccount = "";
//   let TicketIncomeAccount = "";

//   accounts.forEach((acc) => {
//     if (acc.account_name === agentName) customerAccount = acc._id;
//     if (acc.account_name === supplierName) supplierAccount = acc._id;
//     if (acc.account_name === "Ticket Income") TicketIncomeAccount = acc._id;
//   });

//   // 1. Calculate Total Discount given to all passengers in this booking
//   const totalDiscount = (booking.passengers || []).reduce((sum, p) => {
//     return sum + (p.discount || 0);
//   }, 0);

//   // 2. Net Customer Ledger Debit (Selling Price minus the Discount)
//   const grossTotal = booking.pricing.grandTotal || 0;
//   const netCustomerDebit = grossTotal - totalDiscount;

//   // 3. Real Base Cost calculated from Group Ticket Buying Prices
//   const realBaseCost =
//     (groupTKT?.price?.buyingAdultPrice || 0) * (booking.adultsCount || 0) +
//     (groupTKT?.price?.buyingChildPrice || 0) * (booking.childrenCount || 0) +
//     (groupTKT?.price?.buyingInfantPrice || 0) * (booking.infantsCount || 0);

//   // 4. Actual Ticket Income Profit (Net Selling - Real Buying Cost)
//   const ticketIncomeProfit = netCustomerDebit - realBaseCost;

//   const date = new Date().toISOString().split("T")[0];

//   // Build description safely
//   const firstPassenger = booking.passengers?.[0];
//   const passengerName = firstPassenger
//     ? `${firstPassenger.surName} ${firstPassenger.givenName}`
//     : "N/A";

//   const dateOptions = { day: "2-digit", month: "short", year: "numeric" };
//   const formatter = new Intl.DateTimeFormat("en-GB", dateOptions);

//   const departDate = booking.departureDate
//     ? formatter.format(new Date(booking.departureDate)).toUpperCase()
//     : "N/A";

//   const arrivalDate = booking.arrivalDate
//     ? formatter.format(new Date(booking.arrivalDate)).toUpperCase()
//     : "N/A";

//   const airlineName = booking.airline?.name || "N/A";
//   const description = `Booking ${passengerName} - ${booking.pnr} - ${booking.sector} - ${airlineName} - ${departDate} - ${arrivalDate}`;

//   // Accounting Rows:
//   // Customer gets DEBITED with Net Selling Amount
//   // Supplier gets CREDITED with Real Buying Cost
//   // Ticket Income gets CREDITED with real Profit Margin
//   const rows = [
//     { account: customerAccount, debit: netCustomerDebit, credit: 0 },
//     ...(realBaseCost > 0
//       ? [{ account: supplierAccount, debit: 0, credit: realBaseCost }]
//       : []),
//     {
//       account: TicketIncomeAccount,
//       debit: 0,
//       credit: realBaseCost > 0 ? ticketIncomeProfit : netCustomerDebit,
//     },
//   ];

//   const formDataToSend = new FormData();
//   formDataToSend.append("type", "journalPortal");
//   formDataToSend.append("date", date);

//   rows.forEach((txn, index) => {
//     formDataToSend.append(
//       `transactions[${index}][metadata]`,
//       JSON.stringify({ id: index }),
//     );
//     formDataToSend.append(`transactions[${index}][account]`, txn.account);
//     formDataToSend.append(`transactions[${index}][description]`, description);
//     formDataToSend.append(`transactions[${index}][credit]`, String(txn.credit));
//     formDataToSend.append(`transactions[${index}][debit]`, String(txn.debit));
//   });

//   const response = await axios.post(
//     `${process.env.ZIP_ACCOUNTS_API_URL}voucher/`,
//     formDataToSend,
//     {
//       headers: {
//         Authorization: `Bearer ${process.env.ZIP_ACCOUNTS_API_KEY}`,
//         dbprefix: process.env.ZIP_ACCOUNTS_DB_PREFIX,
//       },
//     },
//   );

//   return response.data;
// };

export const updateBookingStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) throw new Error("Booking not found");

    // Find group ticket metadata associated with this booking
    const GrpTKT = await GroupTicketing.findById(booking.groupId);

    // Only process ledger hits if confirming, it's a local/sabaoon group, AND it hasn't hit before

    const oldStatus = booking.status;
    const seats = booking.adultsCount + booking.childrenCount;

    // unvoid the voucher if voided
    // if (
    //   oldStatus === "cancelled" &&
    //   status === "confirmed" &&
    //   booking.isLedgerHit &&
    //   booking.zipVoucherId
    // ) {
    //   await zipAccountsService.voidUnvoidVoucher(
    //     booking.zipVoucherId,
    //     "unvoid",
    //   );
    // }

    if (oldStatus !== "cancelled" && status === "cancelled") {
      // // void the voucher of ledger on zip accounts
      // if (booking.zipVoucherId) {
      //   const voidRes = await zipAccountsService.voidUnvoidVoucher(
      //     booking.zipVoucherId,
      //     "void",
      //   );
      //   console.log(voidRes);
      // }
      await adjustSeatsIfLocalGroup(normalizeGroupId(booking.groupId), seats);
    }

    if (oldStatus === "cancelled" && status !== "cancelled") {
      await adjustSeatsIfLocalGroup(
        normalizeGroupId(booking.groupId),
        -seats,
        true,
      );
    }

    booking.status = status;
    booking.notes = notes ?? booking.notes;
    booking.expiresAt =
      status === "on hold" ? new Date(Date.now() + HOLD_DURATION) : null;

    await booking.save();

    res.json({ success: true, data: booking });
  } catch (err) {
    console.log(err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// -------------------------
// UPDATE BOOKING PASSENGER WISE DISCOUNT
// -------------------------

export const savePassengerDiscounts = async (req, res) => {
  try {
    const { bookingId, passengers } = req.body;

    // Validation
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "bookingId is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid bookingId",
      });
    }

    if (!Array.isArray(passengers) || passengers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Passengers array is required",
      });
    }

    // Find Booking
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Update / Upsert passenger discounts
    booking.passengers = booking.passengers.map((existingPassenger) => {
      const matchedPassenger = passengers.find(
        (p) =>
          p.passport?.toUpperCase().trim() ===
          existingPassenger.passport?.toUpperCase().trim(),
      );

      if (matchedPassenger) {
        existingPassenger.discount = matchedPassenger.discount || 0;
      }

      return existingPassenger;
    });

    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Passenger discounts saved successfully",
      data: booking.passengers,
    });
  } catch (error) {
    console.error("savePassengerDiscounts error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// -------------------------
// UPDATE BOOKING DETAILS
// -------------------------
export const updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) throw new Error("Booking not found");
    if (booking.status !== "on hold")
      throw new Error("Only on-hold bookings can be edited");

    const oldSeats = booking.adultsCount + booking.childrenCount;

    // Update fields from body
    Object.assign(booking, req.body);

    // Normalize groupId if updated
    if (req.body.groupId) booking.groupId = normalizeGroupId(req.body.groupId);

    const newSeats = booking.adultsCount + booking.childrenCount;
    const diff = newSeats - oldSeats;

    if (diff > 0) {
      await adjustSeatsIfLocalGroup(booking.groupId, -diff, true);
    } else if (diff < 0) {
      await adjustSeatsIfLocalGroup(booking.groupId, Math.abs(diff));
    }

    booking.expiresAt =
      booking.status === "on hold"
        ? new Date(Date.now() + HOLD_DURATION)
        : null;

    await booking.save();

    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// -------------------------
// CANCEL BOOKING
// -------------------------
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) throw new Error("Booking not found");
    if (booking.status === "cancelled") throw new Error("Already cancelled");

    const seats = booking.adultsCount + booking.childrenCount;

    booking.status = "cancelled";
    booking.expiresAt = null;
    await booking.save();

    await adjustSeatsIfLocalGroup(booking.groupId, seats);

    res.json({ success: true, message: "Booking cancelled", data: booking });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// -------------------------
// DELETE BOOKING (ADMIN ONLY)
// -------------------------
export const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) throw new Error("Booking not found");

    if (booking.status !== "cancelled") {
      const seats = booking.adultsCount + booking.childrenCount;
      await adjustSeatsIfLocalGroup(booking.groupId, seats);
    }

    await booking.deleteOne();

    res.json({ success: true, message: "Booking deleted" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// -------------------------
// BOOKING STATISTICS (ADMIN DASHBOARD)
// -------------------------
export const getBookingStatistics = async (req, res) => {
  try {
    const stats = await Booking.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          revenue: { $sum: "$pricing.grandTotal" },
        },
      },
    ]);

    const totalBookings = await Booking.countDocuments();
    const totalRevenue = await Booking.aggregate([
      { $group: { _id: null, total: { $sum: "$pricing.grandTotal" } } },
    ]);

    res.json({
      success: true,
      data: {
        byStatus: stats,
        totalBookings,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
    });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch statistics" });
  }
};

export const bulkTogglePriceOnCall = async (req, res) => {
  try {
    const { value } = req.body;

    if (typeof value !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Value must be boolean",
      });
    }

    const result = await Register.updateMany(
      {
        role: { $in: ["Agency"] },
      },
      {
        $set: { priceOnCall: value },
      },
    );

    return res.json({
      success: true,
      message: `Updated ${result.modifiedCount} agents`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to Bulk toggle price on call",
    });
  }
};

// -------------------------
// UPLOAD PASSENGER DOCUMENT
// -------------------------
export const uploadPassengerDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }
    // req.file.path is the Cloudinary secure URL
    res.json({ success: true, url: req.file.path });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
