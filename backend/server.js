import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import dbConnection from "./config/db.js";

import groupTicketingRoutes from "./routes/groupTicketing.routes.js";
import authRoutes from "./routes/auth.routes.js";
import bankRoutes from "./routes/bank.routes.js";
import sectorRoutes from "./routes/sector.routes.js";
import airlineRoutes from "./routes/airline.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import alHaiderAPIRoutes from "./routes/alHaiderAPI.routes.js";
import sabaoonAPIRoutes from "./routes/sabaoonAPI.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import exportRoutes from "./routes/export.routes.js";
import specialOffer from "./routes/specialOffer.route.js";
import umrahPackages from "./routes/umrahPackages.routes.js";
import umrahBookingRoutes from "./routes/umrahBooking.routes.js";
import hotelCityRoutes from "./routes/hotelCity.routes.js";
import zipRoutes from "./routes/zipAccounts.routes.js";
import hotelRoutes from "./routes/hotel.routes.js";
import transportRoutes from "./routes/transport.routes.js";
import umrahCalculatorRoutes from "./routes/umrahCalculator.routes.js";
import ummrahVisaRoutes from "./routes/ummrahVisa.routes.js";
import transportRouteRatesRoutes from "./routes/transportRouteRates.routes.js";
import {
  getValidSabaoonToken,
  initializeSabaoonToken,
} from "./utils/sabaoonToken.js";
import testEmail from "./utils/testEmail.js";
import { startBookingExpiryJob } from "./utils/bookingExpiryJob.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dbConnection();
testEmail();

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5174",
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:3001",
      "https://zebtravel.com",
      "https://www.zebtravel.com",
    ],
    credentials: true,
  }),
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

app.use("/api/group-ticketing", groupTicketingRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/bank", bankRoutes);
app.use("/api/sector", sectorRoutes);
app.use("/api/airline", airlineRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/al-haider", alHaiderAPIRoutes);
app.use("/api/sabaoon", sabaoonAPIRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/specialOffer", specialOffer);
app.use("/api/umrahpackages", umrahPackages);
app.use("/api/umrah-bookings", umrahBookingRoutes);
app.use("/api", hotelCityRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/transports", transportRoutes);
app.use("/api/zip-accounts", zipRoutes);
app.use("/api/umrah-calculator", umrahCalculatorRoutes);
app.use("/api/ummrah-visa", ummrahVisaRoutes);
app.use("/api/transport-route-rates", transportRouteRatesRoutes);

/* Initialize Sabaoon token: if DB is empty, hit login API and save token */
(async () => {
  try {
    // Wait a bit for DB connection to be established
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await initializeSabaoonToken();
  } catch (err) {
    console.warn("Sabaoon token initialization failed:", err.message);
  }
})();

/* 🔥 Start Expiry Cron Job */
startBookingExpiryJob();

// Serve static files from React apps
app.use(express.static(path.join(__dirname, "../frontend/dist")));
app.use("/admin-portal", express.static(path.join(__dirname, "../admin/dist")));

app.get("/", (req, res) => {
  res.send("ZEB Travels & Traders Pvt Ltd API is running");
});

// Catch-all handler: serve React app's index.html for any non-API routes
// This must come AFTER all API routes and static middlewares
app.use((req, res) => {
  // Skip API routes - they should have been handled above
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ message: "API endpoint not found" });
  }

  // Check if the request is for admin portal
  if (req.path.startsWith("/admin-portal")) {
    const adminPath = path.join(__dirname, "../admin/dist/index.html");
    res.sendFile(adminPath, (err) => {
      if (err) {
        console.error("Error serving admin index.html:", err);
        res.status(500).send("Internal Server Error");
      }
    });
  } else {
    const frontendPath = path.join(__dirname, "../frontend/dist/index.html");
    res.sendFile(frontendPath, (err) => {
      if (err) {
        console.error("Error serving frontend index.html:", err);
        res.status(500).send("Internal Server Error");
      }
    });
  }
});

const PORT = process.env.PORT || 8007;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
