import mongoose from "mongoose";

// Hotel Schema without supplier
const HotelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: {
      city: { type: String },
      distance: { type: String },
      mapUrl: { type: String },
    },
    rating: { type: Number, default: 0 },
  },
  { _id: false },
);

// Transport Schema without supplier
const TransportSchema = new mongoose.Schema(
  {
    route: { type: String },
    transportType: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { _id: false },
);

// Group Ticket Schema (enhanced with more fields)
const GroupTicketSchema = new mongoose.Schema(
  {
    id: { type: String },
    groupBookingId: { type: String },
    voucher_id: { type: String },
    packageName: { type: String },
    sector: { type: String },
    airline: { type: String },
    totalSeats: { type: Number },
    flights: [
      {
        airline: { type: String },
        flightNo: { type: String },
        depDate: { type: String },
        depTime: { type: String },
        arrDate: { type: String },
        arrTime: { type: String },
        sectorFrom: { type: String },
        sectorTo: { type: String },
        fromTerminal: { type: String },
        toTerminal: { type: String },
        flightClass: { type: String },
        baggage: { type: String },
        meal: { type: String },
      },
    ],
  },
  { _id: false },
);

// Main Umrah Package Schema
const UmrahPackageSchema = new mongoose.Schema(
  {
    packageName: {
      type: String,
      required: true,
    },
    logo: {
      type: String,
      // required: true,
    },
    flightLogo: {
      type: String,
      // required: true,
    },
    hotels: [HotelSchema],
    transports: [TransportSchema],
    rooms: {
      sharing: { type: Number, default: 0 },
      quad: { type: Number, default: 0 },
      quint: { type: Number, default: 0 },
      triple: { type: Number, default: 0 },
      double: { type: Number, default: 0 },
      childWithoutPackage: { type: Number, default: 0 },
      InfantWithoutPackage: { type: Number, default: 0 },
    },
    totalRooms: {
      type: Number,
      default: 0,
    },
    days: {
      type: Number,
      required: true,
    },
    nightCount: {
      type: String,
      default: "0",
    },
    availableRooms: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
      default: "",
    },
    groupTicket: GroupTicketSchema,
  },
  { timestamps: true },
);

export default mongoose.model("umrahPackagemodel", UmrahPackageSchema);
