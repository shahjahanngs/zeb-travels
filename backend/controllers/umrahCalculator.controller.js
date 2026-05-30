import UmrahCalculator from "../models/umrahCalculator.js";
import Booking from "../models/Booking.js";
import GroupTicketing from "../models/GroupTicketing.js";
import { generateVoucher } from "../utils/voucherGenerator.js";
import Voucher from "../models/voucher.js";

const HOLD_DURATION = 2 * 60 * 60 * 1000; // 2 hours

// ➕ Create new Umrah Calculator record + Booking
export const createUmrahCalculator = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      totalCost,
      selectedGroup: groupId,
      passengerCounts,
      passengerDetails,
      groupTicketPricing, // Calculated prices with margins from frontend
    } = req.body;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }

    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: "Group ticket selection is required",
      });
    }

    // Fetch the GroupTicketing record
    const group = await GroupTicketing.findById(groupId);
    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Selected group ticket not found" });
    }

    const adultsCount = passengerCounts?.adults || 0;
    const childrenCount = passengerCounts?.children || 0;
    const infantsCount = passengerCounts?.infants || 0;
    const totalPassengers = adultsCount + childrenCount + infantsCount;
    const seatCount = adultsCount + childrenCount;

    if (seatCount > group.totalSeats) {
      return res
        .status(400)
        .json({ success: false, message: "Not enough seats available" });
    }

    const numericTotalCost = Number(String(totalCost || 0).replace(/,/g, ""));

    // Generate voucher for umrah calculator
    const voucher_id = await generateVoucher(
      "umrahcalculator",
      null,
      "UmrahCalculator",
    );

    // Build passengers array for Booking model
    const passengers = (passengerDetails || []).map((p) => ({
      type: p.type,
      title: p.title || "Mr",
      givenName: p.givenName || p.name?.split(" ")[0] || p.name || "",
      surName:
        p.surName || p.name?.split(" ").slice(1).join(" ") || p.name || "",
      passport: p.passport,
      dateOfBirth: p.dateOfBirth
        ? new Date(p.dateOfBirth)
        : new Date("1990-01-01"),
      passportExpiry: new Date(p.passportExpiry),
      nationality: p.nationality || "Pakistani",
    }));

    // Build flights array for Booking
    const flights = (group.flights || []).map((f) => ({
      flightNo: f.flightNo,
      flightDate: f.depDate,
      depDate: f.depDate,
      depTime: f.depTime,
      origin: f.sectorFrom,
      destination: f.sectorTo,
      arrDate: f.arrDate,
      arrTime: f.arrTime,
      baggage: f.baggage,
      meal: f.meal,
    }));

    // Use calculated total price from frontend (with margin applied once to total)
    // Per-passenger prices with margin are already calculated in frontend
    let adultPrice, childPrice, infantPrice, grandTotal;

    if (groupTicketPricing?.totalPrice) {
      // Margin was applied to total in frontend, use it directly
      grandTotal = groupTicketPricing.totalPrice;

      // Use the per-passenger prices with margin from frontend (already calculated)
      adultPrice =
        groupTicketPricing.adultBasePrice ||
        group.price?.sellingAdultPriceB2B ||
        0;
      childPrice =
        groupTicketPricing.childBasePrice ||
        group.price?.sellingChildPriceB2B ||
        0;
      infantPrice = groupTicketPricing.infantPrice || 0;
    } else {
      // Fallback to base prices
      adultPrice = group.price?.sellingAdultPriceB2B || 0;
      childPrice = group.price?.sellingChildPriceB2B || 0;
      infantPrice = group.price?.sellingInfantPriceB2B || 0;
      grandTotal =
        adultsCount * adultPrice +
        childrenCount * childPrice +
        infantsCount * infantPrice;
    }

    const expiresAt = new Date(Date.now() + HOLD_DURATION);

    // Create the Booking (same as group ticketing booking)
    const booking = await Booking.create({
      groupId: group._id.toString(),
      groupType: group.groupCategory || "Umrah Groups",
      airline: {
        id: null,
        name: group.airline || "",
        logoUrl: null,
      },
      sector: group.sector || "",
      pnr: group.pnr || "",
      contactPersonName: passengers[0]
        ? `${passengers[0].givenName} ${passengers[0].surName}`
        : "N/A",
      adultsCount,
      childrenCount,
      infantsCount,
      totalPassengers,
      pricing: {
        adultPrice,
        childPrice,
        infantPrice,
        adultTotal: adultsCount * adultPrice,
        childTotal: childrenCount * childPrice,
        infantTotal: infantsCount * infantPrice,
        grandTotal,
      },
      passengers,
      flights,
      departureDate: group.flights?.[0]?.depDate || new Date(),
      arrivalDate: group.flights?.[group.flights.length - 1]?.arrDate || null,
      userId,
      status: "on hold",
      expiresAt,
    });

    // Deduct seats from GroupTicketing
    await GroupTicketing.updateOne(
      { _id: groupId },
      { $inc: { totalSeats: -seatCount } },
    );

    // Create UmrahCalculator record
    const umrahCalculator = new UmrahCalculator({
      ...req.body,
      selectedGroup: groupId,
      totalCost: numericTotalCost,
      user: userId,
      voucher_id,
      bookingRef: booking._id,
    });

    await umrahCalculator.save();

    // Update voucher with booking reference
    await Voucher.findOneAndUpdate(
      { voucher_id },
      { booking_ref: umrahCalculator._id },
      { new: true },
    );

    res.status(201).json({
      success: true,
      message: "Umrah Calculator record created successfully",
      data: umrahCalculator,
      booking,
    });
  } catch (error) {
    console.error("Error in createUmrahCalculator:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

// 📥 Get all Umrah Calculator records
export const getAllUmrahCalculators = async (req, res) => {
  try {
    const records = await UmrahCalculator.find()
      .populate("user", "name email phone companyName")
      .populate("selectedGroup")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: records });
  } catch (error) {
    console.error("Error in getAllUmrahCalculators:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

// 📥 Get Umrah Calculator records by user ID
export const getUmrahCalculationsByUserId = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const calculations = await UmrahCalculator.find({ user: userId })
      .populate("user", "name email phone companyName")
      .populate("selectedGroup")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: calculations });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching user umrah calculations",
    });
  }
};

// 📥 Get single Umrah Calculator record by ID
export const getUmrahCalculatorById = async (req, res) => {
  try {
    const id = req.params.id || req.user._id;
    const record = await UmrahCalculator.findById(id)
      .populate("user")
      .populate("selectedGroup");

    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Record not found" });
    }

    res.status(200).json({ success: true, data: record });
  } catch (error) {
    console.error("Error in getUmrahCalculatorById:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

// ✏️ Update Umrah Calculator record
export const updateUmrahCalculator = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Get the current record first to check for status changes
    const currentRecord = await UmrahCalculator.findById(id);
    if (!currentRecord) {
      return res
        .status(404)
        .json({ success: false, message: "Record not found" });
    }

    const previousStatus = currentRecord.status;
    const statusChanged = status && status !== previousStatus;

    // Update the umrah calculator record
    const record = await UmrahCalculator.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    // If status was changed, handle booking status and seat adjustments
    if (statusChanged && record.bookingRef) {
      const allowedStatuses = ["On Process", "Cancel", "Confirm", "Pending"];

      if (allowedStatuses.includes(status)) {
        let bookingStatus = null;

        if (status === "Cancel") {
          bookingStatus = "cancelled";

          // Return seats to GroupTicketing (only if not already cancelled)
          if (previousStatus !== "Cancel") {
            const adultsCount = record.passengerCounts?.adults || 0;
            const childrenCount = record.passengerCounts?.children || 0;
            // Infants don't count as seats
            const seatCount = adultsCount + childrenCount;

            await GroupTicketing.updateOne(
              { _id: record.selectedGroup },
              { $inc: { totalSeats: seatCount } },
            );
          }
        } else if (status === "Confirm") {
          bookingStatus = "confirmed";
          // No seat adjustment needed - seats were already deducted during creation
        } else if (status === "On Process" || status === "Pending") {
          bookingStatus = "on hold";
        }

        // Update the corresponding booking status
        if (bookingStatus) {
          await Booking.updateOne(
            { _id: record.bookingRef },
            { status: bookingStatus },
          );

          // Handle credit management for B2B umrah bookings
          if (record.user) {
            const booking = await Booking.findById(record.bookingRef);
            if (booking) {
              const amount = booking.pricing.grandTotal;
              let creditDiff = 0;

              // Check if it's B2B (has userId and not B2C)
              const isB2BBooking = booking.userId && !booking.isB2C;

              if (isB2BBooking) {
                // Get the old booking status to compare
                const oldBookingStatus =
                  previousStatus === "Confirm"
                    ? "confirmed"
                    : previousStatus === "Cancel"
                      ? "cancelled"
                      : "on hold";

                // Deduct credit when moving TO confirmed status
                if (
                  bookingStatus === "confirmed" &&
                  oldBookingStatus !== "confirmed"
                ) {
                  creditDiff = -amount;
                }

                // Refund credit when moving FROM confirmed to any other status
                if (
                  oldBookingStatus === "confirmed" &&
                  bookingStatus !== "confirmed"
                ) {
                  creditDiff = amount;
                }

                // Update agent credit balance
                if (creditDiff !== 0) {
                  const Register = (await import("../models/Register.js"))
                    .default;
                  await Register.updateOne(
                    { _id: booking.userId },
                    { $inc: { creditAmount: creditDiff } },
                  );
                }
              }
            }
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "Record updated successfully",
      data: record,
    });
  } catch (error) {
    console.error("Error in updateUmrahCalculator:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

// 🗑 Delete Umrah Calculator record
export const deleteUmrahCalculator = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await UmrahCalculator.findByIdAndDelete(id);

    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Record not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Record deleted successfully" });
  } catch (error) {
    console.error("Error in deleteUmrahCalculator:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

// 🔄 Update Umrah Calculator status
export const updateUmrahStatusController = async (req, res) => {
  try {
    const { umrahId } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["On Process", "Cancel", "Confirm", "Pending"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`,
      });
    }

    // Find the umrah calculator record first
    const umrahRecord = await UmrahCalculator.findById(umrahId);
    if (!umrahRecord) {
      return res
        .status(404)
        .json({ success: false, message: "Umrah Calculator record not found" });
    }

    // Store previous status to check if we need to adjust seats
    const previousStatus = umrahRecord.status;

    // Update the umrah calculator status
    umrahRecord.status = status;
    await umrahRecord.save();

    // Handle booking status and seat adjustments
    if (umrahRecord.bookingRef) {
      let bookingStatus = null;

      if (status === "Cancel") {
        bookingStatus = "cancelled";

        // Return seats to GroupTicketing (only if not already cancelled)
        if (previousStatus !== "Cancel") {
          const adultsCount = umrahRecord.passengerCounts?.adults || 0;
          const childrenCount = umrahRecord.passengerCounts?.children || 0;
          // Infants don't count as seats
          const seatCount = adultsCount + childrenCount;

          await GroupTicketing.updateOne(
            { _id: umrahRecord.selectedGroup },
            { $inc: { totalSeats: seatCount } },
          );
        }
      } else if (status === "Confirm") {
        bookingStatus = "confirmed";
        // No seat adjustment needed - seats were already deducted during creation
      } else if (status === "On Process" || status === "Pending") {
        bookingStatus = "on hold";
      }

      // Update the corresponding booking status
      if (bookingStatus) {
        await Booking.updateOne(
          { _id: umrahRecord.bookingRef },
          { status: bookingStatus },
        );
      }
    }

    res.status(200).json({
      success: true,
      message: "Umrah Calculator status updated successfully",
      data: umrahRecord,
    });
  } catch (error) {
    console.error("Error in updateUmrahStatusController:", error);
    res.status(500).json({
      success: false,
      message: "Error while updating umrah status",
      error: error.message,
    });
  }
};

/* =========================================================
   CREATE PUBLIC UMRAH CALCULATOR (B2C - No Authentication Required)
========================================================= */
export const createPublicUmrahCalculator = async (req, res) => {
  try {
    const {
      totalCost,
      selectedGroup: groupId,
      passengerCounts,
      passengerDetails,
      contactEmail,
      contactPhone,
      groupTicketPricing, // Calculated prices with margins from frontend
    } = req.body;

    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: "Group ticket selection is required",
      });
    }

    // Fetch the GroupTicketing record
    const group = await GroupTicketing.findById(groupId);
    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Selected group ticket not found" });
    }

    const adultsCount = passengerCounts?.adults || 0;
    const childrenCount = passengerCounts?.children || 0;
    const infantsCount = passengerCounts?.infants || 0;
    const totalPassengers = adultsCount + childrenCount + infantsCount;
    const seatCount = adultsCount + childrenCount;

    if (seatCount > group.totalSeats) {
      return res
        .status(400)
        .json({ success: false, message: "Not enough seats available" });
    }

    const numericTotalCost = Number(String(totalCost || 0).replace(/,/g, ""));

    // Generate voucher for umrah calculator
    const voucher_id = await generateVoucher(
      "umrahcalculator",
      null,
      "UmrahCalculator",
    );

    // Build passengers array for Booking model
    const passengers = (passengerDetails || []).map((p) => ({
      type: p.type,
      title: p.title || "Mr",
      givenName: p.givenName || p.name?.split(" ")[0] || p.name || "",
      surName:
        p.surName || p.name?.split(" ").slice(1).join(" ") || p.name || "",
      passport: p.passport,
      dateOfBirth: p.dateOfBirth
        ? new Date(p.dateOfBirth)
        : new Date("1990-01-01"),
      passportExpiry: new Date(p.passportExpiry),
      nationality: p.nationality || "Pakistani",
    }));

    // Build flights array for Booking
    const flights = (group.flights || []).map((f) => ({
      flightNo: f.flightNo,
      flightDate: f.depDate,
      depDate: f.depDate,
      depTime: f.depTime,
      origin: f.sectorFrom,
      destination: f.sectorTo,
      arrDate: f.arrDate,
      arrTime: f.arrTime,
      baggage: f.baggage,
      meal: f.meal,
    }));

    // Use calculated total price from frontend (with margin applied once to total)
    // Per-passenger prices with margin are already calculated in frontend
    let adultPrice, childPrice, infantPrice, grandTotal;

    if (groupTicketPricing?.totalPrice) {
      // Margin was applied to total in frontend, use it directly
      grandTotal = groupTicketPricing.totalPrice;

      // Use the per-passenger prices with margin from frontend (already calculated)
      adultPrice =
        groupTicketPricing.adultBasePrice ||
        group.price?.sellingAdultPriceB2B ||
        0;
      childPrice =
        groupTicketPricing.childBasePrice ||
        group.price?.sellingChildPriceB2B ||
        0;
      infantPrice = groupTicketPricing.infantPrice || 0;
    } else {
      // Fallback to base prices
      adultPrice = group.price?.sellingAdultPriceB2B || 0;
      childPrice = group.price?.sellingChildPriceB2B || 0;
      infantPrice = group.price?.sellingInfantPriceB2B || 0;
      grandTotal =
        adultsCount * adultPrice +
        childrenCount * childPrice +
        infantsCount * infantPrice;
    }

    const expiresAt = new Date(Date.now() + HOLD_DURATION);

    // Create the Booking for B2C users (no userId)
    const booking = await Booking.create({
      groupId: group._id.toString(),
      groupType: group.groupCategory || "Umrah Groups",
      airline: {
        id: null,
        name: group.airline || "",
        logoUrl: null,
      },
      sector: group.sector || "",
      pnr: group.pnr || "",
      contactPersonName: passengers[0]
        ? `${passengers[0].givenName} ${passengers[0].surName}`
        : "N/A",
      contactEmail: contactEmail || "",
      contactPhone: contactPhone || "",
      adultsCount,
      childrenCount,
      infantsCount,
      totalPassengers,
      pricing: {
        adultPrice,
        childPrice,
        infantPrice,
        adultTotal: adultsCount * adultPrice,
        childTotal: childrenCount * childPrice,
        infantTotal: infantsCount * infantPrice,
        grandTotal,
      },
      passengers,
      flights,
      departureDate: group.flights?.[0]?.depDate || new Date(),
      arrivalDate: group.flights?.[group.flights.length - 1]?.arrDate || null,
      userId: null, // No user ID for public bookings
      status: "on hold",
      isB2C: true, // Flag for B2C booking
      expiresAt,
    });

    // Deduct seats from GroupTicketing
    await GroupTicketing.updateOne(
      { _id: groupId },
      { $inc: { totalSeats: -seatCount } },
    );

    // Create UmrahCalculator record for B2C
    const umrahCalculator = new UmrahCalculator({
      ...req.body,
      selectedGroup: groupId,
      totalCost: numericTotalCost,
      user: null, // No user for B2C bookings
      isB2C: true, // Flag for B2C
      voucher_id,
      bookingRef: booking._id,
    });

    await umrahCalculator.save();

    // Update voucher with booking reference
    await Voucher.findOneAndUpdate(
      { voucher_id },
      { booking_ref: umrahCalculator._id },
      { new: true },
    );

    res.status(201).json({
      success: true,
      message: "Booking inquiry submitted! Our team will contact you soon.",
      data: umrahCalculator,
      booking,
    });
  } catch (error) {
    console.error("B2C Umrah Calculator error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};
