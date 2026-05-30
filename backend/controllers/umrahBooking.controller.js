import UmrahPackageBooking from "../models/UmrahPackageBooking.js";
import Booking from "../models/Booking.js";
import GroupTicketing from "../models/GroupTicketing.js";
import UmrahPackage from "../models/umrahPackgemodel.js";
import Payment from "../models/Payment.js";
import mongoose from "mongoose";

const HOLD_DURATION = 2 * 60 * 60 * 1000; // 2 hours

/* ===========================
   HELPER: Adjust seats in Group Ticketing
=========================== */
const adjustSeatsIfLocalGroup = async (
  groupId,
  seatChange,
  checkAvailability = false,
) => {
  if (!mongoose.Types.ObjectId.isValid(groupId)) return; // External group → ignore

  const query = { _id: groupId };

  if (checkAvailability && seatChange < 0) {
    query.totalSeats = { $gte: Math.abs(seatChange) };
  }

  const result = await GroupTicketing.updateOne(query, {
    $inc: { totalSeats: seatChange },
  });

  if (result.matchedCount === 0) return; // Not stored locally → ignore
  if (checkAvailability && result.modifiedCount === 0)
    throw new Error("Not enough seats available in group ticket");
};

/* ===========================
   HELPER: Create Group Booking from Umrah Booking
=========================== */
const createGroupBookingFromUmrah = async (
  umrahBooking,
  packageData,
  groupTicket,
  userId,
  grpTKT,
) => {
  // Count passengers by type
  let adultsCount = 0;
  let childrenCount = 0;
  let infantsCount = 0;

  umrahBooking.passengers.forEach((passenger) => {
    if (passenger.type === "Adult") adultsCount++;
    else if (passenger.type === "Child") childrenCount++;
    else if (passenger.type === "Infant") infantsCount++;
  });

  const totalPassengers = umrahBooking.passengers.length;
  const seatCount = adultsCount + childrenCount; // Infants don't take seats

  // Generate booking reference
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();

  // Map Umrah passengers to Booking format
  const bookingPassengers = umrahBooking.passengers.map((passenger) => ({
    type: passenger.type,
    title: passenger.title,
    givenName: passenger.givenName,
    surName: passenger.surName,
    passport: passenger.passport,
    dateOfBirth: passenger.dateOfBirth,
    passportExpiry: passenger.passportExpiry,
    passportIssue: passenger.passportIssue || null,
    nationality: passenger.nationality,
    documentUrl: passenger.documentUrl || null,
  }));

  // Map flights from group ticket
  const bookingFlights = (groupTicket.flights || []).map((flight) => ({
    flightNo: flight.flightNo,
    flightDate: flight.depDate ? new Date(flight.depDate) : null,
    depDate: flight.depDate ? new Date(flight.depDate) : null,
    depTime: flight.depTime,
    origin: flight.sectorFrom,
    destination: flight.sectorTo,
    arrDate: flight.arrDate ? new Date(flight.arrDate) : null,
    arrTime: flight.arrTime,
    baggage: flight.baggage,
    meal: flight.meal,
  }));

  // Get departure and arrival dates
  const departureDate = bookingFlights[0]?.depDate || new Date();
  const arrivalDate =
    bookingFlights[bookingFlights.length - 1]?.arrDate || null;

  // Calculate pricing (using Umrah package pricing)
  const pricePerPerson = umrahBooking.pricing.pricePerPerson || 0;
  const adultPrice = pricePerPerson;
  const childPrice = pricePerPerson;
  const infantPrice = pricePerPerson;

  const expiresAt = new Date(Date.now() + HOLD_DURATION);

  const bookingData = {
    groupId: groupTicket.id || groupTicket._id?.toString() || "",
    groupType: "Umrah Groups",
    airline: {
      name: groupTicket.airline || "Unknown",
    },
    sector: groupTicket.sector || "",
    pnr: grpTKT.pnr || "",
    contactPersonName:
      umrahBooking.passengers[0]?.givenName +
        " " +
        umrahBooking.passengers[0]?.surName || "N/A",
    adultsCount,
    childrenCount,
    supplierName: grpTKT.supplierName || "",
    infantsCount,
    source: "umrah-package",
    totalPassengers,
    pricing: {
      adultPrice,
      childPrice,
      infantPrice,
      adultBasePrice: adultPrice,
      childBasePrice: childPrice,
      infantBasePrice: infantPrice,
      adultTotal: adultsCount * adultPrice,
      childTotal: childrenCount * childPrice,
      infantTotal: infantsCount * infantPrice,
      grandTotal:
        adultsCount * adultPrice +
        childrenCount * childPrice +
        infantsCount * infantPrice,
    },
    passengers: bookingPassengers,
    flights: bookingFlights,
    departureDate,
    arrivalDate,
    userId,
    status: "on hold",
    expiresAt,
    notes: `Auto-created from Umrah Package Booking: ${umrahBooking.bookingNumber}`,
  };

  const booking = await Booking.create(bookingData);
  return { booking, seatCount };
};

/* ===========================
   HELPER: Parse FormData fields with bracket notation
   Example: "pricing[pricePerPerson]" -> { pricing: { pricePerPerson: value }}
=========================== */
const parseFormData = (body) => {
  const parsed = {};

  for (const [key, value] of Object.entries(body)) {
    // Handle bracket notation like pricing[pricePerPerson]
    const match = key.match(/^(.+?)\[(.+?)\]$/);

    if (match) {
      const [, parentKey, childKey] = match;
      if (!parsed[parentKey]) parsed[parentKey] = {};
      parsed[parentKey][childKey] = value;
    } else {
      parsed[key] = value;
    }
  }

  return parsed;
};

/* ===========================
   HELPER: Parse passengers array from FormData
   Example: passengers[0][type] -> [{ type: value, ... }]
=========================== */
const parsePassengers = (body) => {
  // If multer/qs already parsed passengers into an array of objects, use it directly
  if (
    Array.isArray(body.passengers) &&
    body.passengers.length > 0 &&
    typeof body.passengers[0] === "object"
  ) {
    return body.passengers;
  }

  // If it's a JSON string, parse it
  if (typeof body.passengers === "string") {
    try {
      const parsed = JSON.parse(body.passengers);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {}
  }

  // Fallback: parse bracket notation keys manually (e.g. passengers[0][type])
  const passengersMap = {};
  for (const [key, value] of Object.entries(body)) {
    const match = key.match(/^passengers\[(\d+)\]\[(.+)\]$/);
    if (match) {
      const [, index, field] = match;
      const idx = parseInt(index, 10);
      if (!passengersMap[idx]) passengersMap[idx] = {};
      passengersMap[idx][field] = value;
    }
  }

  return Object.keys(passengersMap)
    .map(Number)
    .sort((a, b) => a - b)
    .map((idx) => passengersMap[idx]);
};

/* ===========================
   CREATE UMRAH PACKAGE BOOKING
   
   If package has a linked group ticket, this will also:
   - Deduct seats from the group ticket
=========================== */
export const createUmrahBooking = async (req, res) => {
  let seatsDeducted = 0;
  let groupTicketId = null;
  try {
    // Debug: Log all keys in req.body
    // console.log("req.body keys:", Object.keys(req.body));

    // Parse FormData
    const parsedData = parseFormData(req.body);
    const passengers = parsePassengers(req.body);

    // Debug logging
    // console.log("Parsed passengers count:", passengers.length);
    // console.log("Passengers:", JSON.stringify(passengers, null, 2));

    // Validate passengers exist
    if (!passengers || passengers.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "No passengers found in request. Please add at least one passenger.",
      });
    }

    // Parse packageData JSON if it exists
    let packageData = parsedData.packageData;
    if (typeof packageData === "string") {
      try {
        packageData = JSON.parse(packageData);
      } catch (e) {
        console.error("Error parsing packageData:", e);
      }
    }

    // Generate unique booking number
    const timestamp = Date.now();
    const randomSuffix = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
    const bookingNumber = `UMR-${timestamp}-${randomSuffix}`;

    // Get pricing from parsed data
    const pricing = parsedData.pricing || {};
    const totalPassengers = passengers?.length || 0;
    const totalPrice =
      pricing.totalAmount || pricing.pricePerPerson * totalPassengers || 0;

    // Handle passport files — matched by index via field name passportFile_0, passportFile_1, etc.
    const uploadedFiles = req.files || [];
    const fileByIndex = {};
    uploadedFiles.forEach((f) => {
      const match = f.fieldname.match(/^passportFile_(\d+)$/);
      if (match) fileByIndex[parseInt(match[1], 10)] = f.path;
    });

    const passengersWithFiles = passengers.map((passenger, index) => ({
      ...passenger,
      documentUrl: fileByIndex[index] || null,
    }));

    // Check if package has a linked group ticket
    let linkedGroupTicket = null;
    let umrahPackage = null;

    // Try to find package in local DB if packageId is a valid MongoDB ObjectId
    if (
      parsedData.packageId &&
      mongoose.Types.ObjectId.isValid(parsedData.packageId)
    ) {
      try {
        umrahPackage = await UmrahPackage.findById(parsedData.packageId);
        // console.log("📦 Found package:", umrahPackage?.packageName);
        // console.log("🎫 Group ticket exists?", !!umrahPackage?.groupTicket);
        // console.log(
        //   "🎫 Group ticket full data:",
        //   JSON.stringify(umrahPackage?.groupTicket, null, 2),
        // );

        if (umrahPackage && umrahPackage.groupTicket) {
          linkedGroupTicket = umrahPackage.groupTicket;

          // Get group ticket ID from either id or _id field
          groupTicketId =
            linkedGroupTicket.id || linkedGroupTicket._id?.toString();

          // console.log("🆔 Group Ticket ID found:", groupTicketId);
          // console.log("🆔 Type of groupTicketId:", typeof groupTicketId);
          // console.log("🆔 linkedGroupTicket.id value:", linkedGroupTicket.id);
          // console.log("🆔 linkedGroupTicket._id value:", linkedGroupTicket._id);

          if (groupTicketId) {
            // Calculate seat count (adults + children, NOT infants)
            const seatCount = passengersWithFiles.filter(
              (p) => p.type === "Adult" || p.type === "Child",
            ).length;

            // STEP 1: Deduct seats from group ticket
            await adjustSeatsIfLocalGroup(groupTicketId, -seatCount, true);
            seatsDeducted = seatCount;

            console.log(
              `✅ Deducted ${seatCount} seats from group ticket ${groupTicketId}`,
            );
          } else {
            console.warn("⚠️ Group ticket exists but has no valid ID");
            linkedGroupTicket = null; // Don't create booking without valid ID
          }
        } else {
          console.log("ℹ️ No group ticket linked to this package");
        }
      } catch (error) {
        console.error("Error checking/deducting group ticket:", error);
        throw new Error(`Failed to process group ticket: ${error.message}`);
      }
    }
    // console.log(linkedGroupTicket);
    // HOLD DURATION TIMER
    const expiresAt = new Date(Date.now() + HOLD_DURATION);

    const bookingData = {
      expiresAt,
      packageId: parsedData.packageId,
      packageName: parsedData.packageName,
      packageSource: "local-db",
      user: parsedData.user,
      roomType: parsedData.roomType,
      specialRequests: parsedData.specialRequests,
      passengers: passengersWithFiles,
      packageData: packageData,
      bookingNumber,
      pricing: {
        pricePerPerson: pricing.pricePerPerson,
        currency: pricing.currency || "PKR",
        totalPrice: parseFloat(totalPrice),
      },
      paymentStatus: {
        status: "Pending",
        totalAmount: parseFloat(totalPrice),
        paidAmount: 0,
        remainingAmount: parseFloat(totalPrice),
        paymentHistory: [],
      },
    };

    // console.log(
    //   "Creating booking with data:",
    //   JSON.stringify(bookingData, null, 2),
    // );

    // STEP 2: Create Umrah booking
    const booking = await UmrahPackageBooking.create(bookingData);

    // STEP 3: Create Group Booking if group ticket is linked
    let groupBooking = null;
    // console.log(
    //   "🔗 LinkedGroupTicket before creating booking:",
    //   linkedGroupTicket ? "EXISTS" : "NULL",
    // );
    // console.log("🔗 LinkedGroupTicket ID:", groupTicketId);
    // const grpTKT = await GroupTicketing.findById(groupTicketId);
    // if (linkedGroupTicket) {
    //   try {
    //     const result = await createGroupBookingFromUmrah(
    //       booking,
    //       packageData || umrahPackage,
    //       linkedGroupTicket,
    //       parsedData.user,
    //       grpTKT,
    //     );
    //     groupBooking = result.booking;

    //     // Store the linked group booking ID in Umrah booking
    //     booking.linkedGroupBookingId = groupBooking._id;
    //     await booking.save();

    //     console.log(
    //       `✅ Created group booking ${groupBooking.bookingReference} for Umrah booking ${booking.bookingNumber}`,
    //     );
    //   } catch (error) {
    //     console.error("Error creating group booking:", error);
    //     // Rollback: Delete the Umrah booking
    //     await UmrahPackageBooking.findByIdAndDelete(booking._id);
    //     throw new Error(`Failed to create group booking: ${error.message}`);
    //   }
    // }

    res.status(201).json({
      success: true,
      message: "Umrah package booking created successfully",
      data: booking,
      groupBooking: groupBooking
        ? {
            bookingReference: groupBooking.bookingReference,
            status: groupBooking.status,
            expiresAt: groupBooking.expiresAt,
          }
        : null,
    });
  } catch (error) {
    console.error("Create Umrah Booking Error:", error);

    // ROLLBACK: Add seats back if they were deducted
    if (seatsDeducted > 0 && groupTicketId) {
      try {
        await adjustSeatsIfLocalGroup(groupTicketId, seatsDeducted);
        console.log(
          `🔄 Rolled back ${seatsDeducted} seats to group ticket ${groupTicketId}`,
        );
      } catch (rollbackError) {
        console.error("Error rolling back seats:", rollbackError);
      }
    }

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===========================
   GET ALL UMRAH BOOKINGS
=========================== */
export const getAllUmrahBookings = async (req, res) => {
  try {
    const { status, user, packageId } = req.query;

    // Build filter
    const filter = {};
    if (status) filter.overallStatus = status;
    if (user) filter.user = user;
    if (packageId) filter.packageId = packageId;

    const bookings = await UmrahPackageBooking.find(filter)
      .populate(
        "user",
        "name email phone role companyName agencyCode consultant",
      )
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error("Get All Umrah Bookings Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===========================
   GET MY BOOKINGS (USER)
=========================== */
export const getMyBookings = async (req, res) => {
  try {
    // req.user is set by protect middleware
    const bookings = await UmrahPackageBooking.find({
      user: req.user._id.toString(),
    })
      .populate(
        "user",
        "name email phone role companyName agencyCode consultant",
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error("Get My Bookings Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===========================
   GET ALL BOOKINGS (ADMIN ONLY)
=========================== */
export const getAllBookingsAdmin = async (req, res) => {
  try {
    const { status, user, packageId, search } = req.query;

    // Build filter
    const filter = {};
    if (status) filter.overallStatus = status;
    if (user) filter.user = user;
    if (packageId) filter.packageId = packageId;
    if (search) {
      filter.$or = [
        { bookingNumber: { $regex: search, $options: "i" } },
        { packageName: { $regex: search, $options: "i" } },
      ];
    }

    const bookings = await UmrahPackageBooking.find(filter)
      .populate(
        "user",
        "name email phone role companyName agencyCode consultant",
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error("Get All Bookings Admin Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===========================
   GET SINGLE UMRAH BOOKING BY ID
=========================== */
export const getUmrahBookingById = async (req, res) => {
  try {
    const booking = await UmrahPackageBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Umrah booking not found",
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error("Get Umrah Booking Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===========================
   UPDATE UMRAH BOOKING
=========================== */
export const updateUmrahBooking = async (req, res) => {
  try {
    // If updating passengers, recalculate total price
    if (req.body.passengers || req.body.pricing?.pricePerPerson) {
      const booking = await UmrahPackageBooking.findById(req.params.id);
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Umrah booking not found",
        });
      }

      const passengers = req.body.passengers || booking.passengers;
      const pricePerPerson =
        req.body.pricing?.pricePerPerson || booking.pricing.pricePerPerson;
      const totalPrice = pricePerPerson * passengers.length;

      req.body.pricing = {
        ...booking.pricing,
        ...req.body.pricing,
        totalPrice,
      };

      // Update payment status total amount if needed
      if (req.body.paymentStatus) {
        req.body.paymentStatus.totalAmount = totalPrice;
      } else {
        req.body.paymentStatus = {
          ...booking.paymentStatus,
          totalAmount: totalPrice,
        };
      }
    }

    const booking = await UmrahPackageBooking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Umrah booking not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Umrah booking updated successfully",
      data: booking,
    });
  } catch (error) {
    console.error("Update Umrah Booking Error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===========================
   DELETE UMRAH BOOKING
=========================== */
export const deleteUmrahBooking = async (req, res) => {
  try {
    const booking = await UmrahPackageBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Umrah booking not found",
      });
    }

    // If there's a linked group booking, cancel it and return seats
    if (booking.linkedGroupBookingId) {
      try {
        const groupBooking = await Booking.findById(
          booking.linkedGroupBookingId,
        );

        if (groupBooking && groupBooking.status !== "cancelled") {
          // Calculate seats to return
          const seatsToReturn =
            groupBooking.adultsCount + groupBooking.childrenCount;

          // Cancel the group booking
          groupBooking.status = "cancelled";
          groupBooking.expiresAt = null;
          await groupBooking.save();

          // Return seats to group ticket
          if (mongoose.Types.ObjectId.isValid(groupBooking.groupId)) {
            await GroupTicketing.updateOne(
              { _id: groupBooking.groupId },
              { $inc: { totalSeats: seatsToReturn } },
            );
            console.log(
              `🔄 Returned ${seatsToReturn} seats to group ticket ${groupBooking.groupId}`,
            );
          }

          console.log(
            `✅ Cancelled linked group booking ${groupBooking.bookingReference}`,
          );
        }
      } catch (error) {
        console.error("Error cancelling linked group booking:", error);
        // Continue with deleting Umrah booking even if group booking cleanup fails
      }
    }

    // Delete the Umrah booking
    await UmrahPackageBooking.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Umrah booking deleted successfully",
    });
  } catch (error) {
    console.error("Delete Umrah Booking Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===========================
   SUBMIT PAYMENT (AGENT/USER)
   Agent/User submits payment - MUST be full amount
=========================== */
export const submitPayment = async (req, res) => {
  try {
    const booking = await UmrahPackageBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Umrah booking not found",
      });
    }

    // Verify user owns this booking
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only submit payments for your own bookings",
      });
    }

    // Allow multiple payments - only check if there's a pending payment
    const hasPendingPayment = booking.paymentStatus.paymentHistory?.some(
      (payment) => payment.paymentStatus === "Pending",
    );

    if (hasPendingPayment) {
      return res.status(400).json({
        success: false,
        message:
          "Please wait for current payment to be reviewed before submitting another",
      });
    }

    const { amount, receiptNumber, notes } = req.body;

    // Parse bank info from JSON string
    let bankData = null;
    if (req.body.bank) {
      try {
        bankData =
          typeof req.body.bank === "string"
            ? JSON.parse(req.body.bank)
            : req.body.bank;
      } catch (_) {}
    }

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: "Amount is required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Receipt file is required",
      });
    }

    const submittedAmount = parseFloat(amount);
    const remainingAmount = booking.paymentStatus.remainingAmount;

    // Allow partial or full payments (up to remaining amount)
    if (submittedAmount > remainingAmount) {
      return res.status(400).json({
        success: false,
        message: `Payment amount cannot exceed remaining amount of PKR ${remainingAmount.toLocaleString()}`,
      });
    }

    if (submittedAmount < 1) {
      return res.status(400).json({
        success: false,
        message: "Payment amount must be at least PKR 1",
      });
    }

    // Create new payment history item
    const newPayment = {
      amount: submittedAmount,
      method: "Bank Transfer",
      bank: bankData,
      paymentDate: new Date(),
      receiptNumber: receiptNumber || "",
      receiptFile: req.file.path, // Cloudinary URL
      notes: notes || "",
      paymentStatus: "Pending", // Admin needs to review
      submittedBy: req.user._id.toString(),
    };

    // Add to payment history
    if (!booking.paymentStatus.paymentHistory) {
      booking.paymentStatus.paymentHistory = [];
    }
    booking.paymentStatus.paymentHistory.push(newPayment);

    // Update overall payment status to Pending
    booking.paymentStatus.status = "Pending";

    await booking.save();

    res.status(200).json({
      success: true,
      message: "Payment submitted successfully. Waiting for admin review.",
      data: booking,
    });
  } catch (error) {
    console.error("Submit Payment Error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===========================
   REVIEW PAYMENT (ADMIN ONLY)
   Admin reviews single payment and updates status
   
   NOTE: This function works with booking data only.
   No package lookup required - booking stores all needed info.
=========================== */
export const reviewPayment = async (req, res) => {
  try {
    const { paymentId } = req.params; // This is actually bookingId now
    const { paymentStatus, rejectionReason } = req.body;

    // Find booking by ID
    const booking = await UmrahPackageBooking.findById(paymentId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if payment has been submitted (check payment history)
    const pendingPayment = booking.paymentStatus.paymentHistory?.find(
      (payment) => payment.paymentStatus === "Pending",
    );

    if (!pendingPayment) {
      return res.status(400).json({
        success: false,
        message: "No pending payment found for this booking",
      });
    }

    // Validate status
    if (!["Pending", "Approved", "Rejected"].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    // Check rejection reason if status is Rejected
    if (paymentStatus === "Rejected" && !rejectionReason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required when rejecting payment",
      });
    }

    // Update the pending payment in history
    pendingPayment.paymentStatus = paymentStatus;
    pendingPayment.reviewedBy = req.user._id.toString();
    pendingPayment.reviewedAt = new Date();

    if (paymentStatus === "Rejected") {
      pendingPayment.rejectionReason = rejectionReason;
      // Reset overall status back to Pending if payment rejected
      booking.overallStatus = "Pending";
      booking.paymentStatus.status = "Pending";
    }

    // If approved, add proof file and update overall status
    if (paymentStatus === "Approved") {
      if (req.file) {
        pendingPayment.approvalProofFile = req.file.path; // Cloudinary URL
      }

      // Update paid amount and remaining amount
      booking.paymentStatus.paidAmount += pendingPayment.amount;
      booking.paymentStatus.remainingAmount =
        booking.paymentStatus.totalAmount - booking.paymentStatus.paidAmount;

      // Update overall payment status to Approved (always, even if partial)
      booking.paymentStatus.status = "Approved";

      // Update overall booking status to In Progress when payment approved
      if (booking.overallStatus === "Pending") {
        booking.overallStatus = "In Progress";
      }

      // Create Payment document in DB
      try {
        const bankId = pendingPayment.bank?.bankId || null;

        if (bankId) {
          await Payment.create({
            date: pendingPayment.paymentDate || new Date(),
            description: `Umrah Package Payment - ${booking.bookingNumber} - ${booking.packageName}`,
            bankAccount: bankId,
            user: new mongoose.Types.ObjectId(booking.user),
            booking: booking._id,
            amount: pendingPayment.amount,
            receipt: pendingPayment.receiptFile || null,
            status: "Approved",
            remarks: pendingPayment.notes || "",
            editedBy: req.user._id,
            editedAt: new Date(),
          });
        }
      } catch (paymentCreateError) {
        console.error("Error creating Payment document:", paymentCreateError);
        // Non-blocking - don't fail the whole request
      }
    }

    await booking.save();

    res.status(200).json({
      success: true,
      message: `Payment ${paymentStatus.toLowerCase()} successfully`,
      data: booking,
    });
  } catch (error) {
    console.error("Review Payment Error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===========================
   UPDATE BOOKING STATUS (Simplified - Only 3 statuses)
   
   This replaces the old visa, hotel, and overall status updates.
   Now we have only: on hold, confirmed, cancelled
=========================== */
export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    // Validate status
    const validStatuses = ["on hold", "confirmed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const booking = await UmrahPackageBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Umrah booking not found",
      });
    }

    const oldStatus = booking.bookingStatus;

    // Handle linked group booking status updates
    if (booking.linkedGroupBookingId) {
      try {
        const groupBooking = await Booking.findById(
          booking.linkedGroupBookingId,
        );

        if (groupBooking) {
          // If changing to "cancelled", cancel group booking and return seats
          if (
            status === "cancelled" &&
            oldStatus !== "cancelled" &&
            groupBooking.status !== "cancelled"
          ) {
            const seatsToReturn =
              groupBooking.adultsCount + groupBooking.childrenCount;

            // Cancel the group booking
            groupBooking.status = "cancelled";
            groupBooking.expiresAt = null;
            await groupBooking.save();

            // Return seats to group ticket
            if (mongoose.Types.ObjectId.isValid(groupBooking.groupId)) {
              await GroupTicketing.updateOne(
                { _id: groupBooking.groupId },
                { $inc: { totalSeats: seatsToReturn } },
              );
              console.log(
                `🔄 Returned ${seatsToReturn} seats to group ticket ${groupBooking.groupId}`,
              );
            }

            console.log(
              `✅ Cancelled linked group booking ${groupBooking.bookingReference}`,
            );
          }

          // If changing to "confirmed", confirm group booking
          else if (
            status === "confirmed" &&
            groupBooking.status === "on hold"
          ) {
            groupBooking.status = "confirmed";
            groupBooking.expiresAt = null; // Remove expiry since it's confirmed
            await groupBooking.save();
            console.log(
              `✅ Confirmed linked group booking ${groupBooking.bookingReference}`,
            );
          }
        }
      } catch (error) {
        console.error("Error updating linked group booking:", error);
        // Continue with status update even if group booking update fails
      }
    }

    // Update the Umrah booking status
    booking.bookingStatus = status;
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Booking status updated successfully",
      data: booking,
    });
  } catch (error) {
    console.error("Update Booking Status Error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===========================
   DEPRECATED FUNCTIONS (Kept for backwards compatibility - can be removed later)
=========================== */

// OLD FUNCTION - updateVisaStatus (No longer used)
export const updateVisaStatus = async (req, res) => {
  return res.status(400).json({
    success: false,
    message:
      "This endpoint is deprecated. Use /booking-status instead with status: 'on hold', 'confirmed', or 'cancelled'",
  });
};

// OLD FUNCTION - updateHotelStatus (No longer used)
export const updateHotelStatus = async (req, res) => {
  return res.status(400).json({
    success: false,
    message:
      "This endpoint is deprecated. Use /booking-status instead with status: 'on hold', 'confirmed', or 'cancelled'",
  });
};

// OLD FUNCTION - updateOverallStatus (No longer used)
export const updateOverallStatus = async (req, res) => {
  return res.status(400).json({
    success: false,
    message:
      "This endpoint is deprecated. Use /booking-status instead with status: 'on hold', 'confirmed', or 'cancelled'",
  });
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
    const booking = await UmrahPackageBooking.findById(bookingId);

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
