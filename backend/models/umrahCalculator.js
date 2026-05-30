import mongoose from "mongoose";

const flightSchema = new mongoose.Schema({
  flightNo: String,
  depDate: String,
  depTime: String,
  sectorFrom: String,
  fromTerminal: String,
  sectorTo: String,
  toTerminal: String,
  flightClass: String,
  arrDate: String,
  arrTime: String,
  baggage: String,
  meal: String,
});

const metadataSchema = new mongoose.Schema({
  buyingCurrency: String,
  buyingPriceAdult: Number,
  buyingPriceChild: Number,
  buyingPriceInfant: Number,
  sellingCurrencyB2B: String,
  sellingPriceAdultB2B: Number,
  sellingPriceChildB2B: Number,
  sellingPriceInfantB2B: Number,
  contactPersonPhone: String,
  contactPersonEmail: String,
  pnr: String,
  internalStatus: String,
});

const selectedGroupSchema = new mongoose.Schema({
  sector: String,
  type: String,
  airline: String,
  groupCategory: String,
  groupName: String,
  noOfDays: Number,
  seats: Number,
  showSeat: Boolean,
  flights: [flightSchema],
  metadata: metadataSchema,
  status: String,
  createdAt: Date,
  updatedAt: Date,
  evoucherAccount: String,
});

const passengerCountsSchema = new mongoose.Schema({
  adults: { type: Number, default: 0 },
  children: { type: Number, default: 0 },
  infants: { type: Number, default: 0 },
});

const visaDetailsSchema = new mongoose.Schema({
  adults: Number,
  children: Number,
  infants: Number,
  adultVisaSelling: Number,
  childVisaSelling: Number,
  infantVisaSelling: Number,
  totalVisaCost: Number,
});

const transportSchema = new mongoose.Schema({
  route: String,
  transportType: String,
  selectTransport: String,
  cost: Number,
  buyingRate: Number,
  passengers: Number,
});

const passengerDetailSchema = new mongoose.Schema({
  type: { type: String, enum: ["Adult", "Child", "Infant"], required: true },
  title: { type: String, required: true },
  givenName: { type: String, required: true },
  surName: { type: String, required: true },
  passport: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  passportExpiry: { type: Date, required: true },
  nationality: { type: String, required: true },
});

const hotelRoomSchema = new mongoose.Schema({
  city: String,
  hotel: String,
  rooms: Number,
  type: String,
  startDate: Date,
  endDate: Date,
  pricePerRoom: Number,
  totalCost: Number,
});

const groupTicketPricingSchema = new mongoose.Schema({
  totalPrice: Number,
  adultBasePrice: Number,
  childBasePrice: Number,
  infantPrice: Number,
  currency: String,
});

const umrahCalculatorSchema = new mongoose.Schema(
  {
    voucher_id: { type: String, required: true, unique: true },
    visaType: { type: String, required: true },
    selectedGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GroupTicketing",
      required: true,
    },
    passengerCounts: passengerCountsSchema,
    passengerDetails: {
      type: [passengerDetailSchema],
      default: [],
    },
    totalCost: Number,
    groupTicketPricing: groupTicketPricingSchema,
    visaDetails: visaDetailsSchema,
    transportList: [transportSchema],
    roomType: String,
    hotelRooms: [hotelRoomSchema],
    status: {
      type: String,
      enum: ["Pending", "On Process", "Cancel", "Confirm"],
      default: "Pending",
    },
    bookingRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Register", // Using existing Register model
      required: false,
    },
    isB2C: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Indexes for performance
umrahCalculatorSchema.index({ user: 1 });
umrahCalculatorSchema.index({ status: 1 });
umrahCalculatorSchema.index({ createdAt: -1 });

export default mongoose.model("UmrahCalculator", umrahCalculatorSchema);
