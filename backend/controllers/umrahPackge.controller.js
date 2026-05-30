import GroupTicketing from "../models/umrahPackgemodel.js";

// Create a new Group Ticketing package
export const createPackages = async (req, res) => {
  try {
    // Files from multer
    const logo = req.files?.logo?.[0]?.path;
    const flightLogo = req.files?.flightLogo?.[0]?.path;

    // Body fields
    const {
      packageName,
      hotels,
      transports,
      rooms,
      availableRooms,
      days,
      nightCount,
      notes,
      groupTicket,
    } = req.body;

    // ✅ Parse JSON safely
    const parsedGroupTicket =
      typeof groupTicket === "string"
        ? JSON.parse(groupTicket)
        : groupTicket || null;

    const parsedHotels =
      typeof hotels === "string" ? JSON.parse(hotels) : hotels || [];

    const parsedTransports =
      typeof transports === "string"
        ? JSON.parse(transports)
        : transports || [];

    const parsedRooms =
      typeof rooms === "string" ? JSON.parse(rooms) : rooms || {};

    const totalRooms =
      Number(parsedRooms.sharing || 0) +
      Number(parsedRooms.quad || 0) +
      Number(parsedRooms.quint || 0) +
      Number(parsedRooms.triple || 0) +
      Number(parsedRooms.double || 0);

    // ✅ Create the Umrah package (without flights and suppliers)
    const newPackage = new GroupTicketing({
      ...(logo && { logo }),
      ...(flightLogo && { flightLogo }),
      packageName,
      hotels: parsedHotels,
      transports: parsedTransports,
      rooms: parsedRooms,
      totalRooms,
      availableRooms: Number(availableRooms) || 0,
      days: Number(days) || 0,
      nightCount: nightCount || "0",
      notes: notes || "",
      ...(parsedGroupTicket && { groupTicket: parsedGroupTicket }),
    });

    // ✅ Save package
    const savedPackage = await newPackage.save();

    // ✅ Respond
    res.status(201).json({
      success: true,
      message: "Umrah package created successfully",
      package: savedPackage,
    });
  } catch (error) {
    console.error("Error creating package:", error);
    res.status(500).json({
      success: false,
      message: "Error creating Umrah package",
      error: error.message,
    });
  }
};

// Get all Group Ticketing packages
export const getAllPackages = async (req, res) => {
  try {
    const packages = await GroupTicketing.find();
    const formatted = packages.map((pkg) => ({
      ...pkg.toObject(),
      id: pkg._id,
    }));
    res.json({ success: true, data: formatted });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching packages" });
  }
};

// Get a single package by ID
export const getPackageById = async (req, res) => {
  try {
    const { id } = req.params;
    const packageData = await GroupTicketing.findById(id);

    if (!packageData)
      return res
        .status(404)
        .json({ success: false, message: "Package not found" });

    res.status(200).json({ success: true, package: packageData });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching package", error });
  }
};

// Update a package
export const updatePackage = async (req, res) => {
  try {
    const { id } = req.params;

    const logo = req.files?.logo ? req.files.logo[0].path : undefined;
    const flightLogo = req.files?.flightLogo
      ? req.files.flightLogo[0].path
      : undefined;

    const {
      packageName,
      hotels,
      transports,
      rooms,
      availableRooms,
      days,
      nightCount,
      notes,
      groupTicket,
    } = req.body;

    // Parse JSON strings safely
    const parsedHotels =
      typeof hotels === "string" ? JSON.parse(hotels) : hotels;
    const parsedTransports =
      typeof transports === "string" ? JSON.parse(transports) : transports;
    const parsedRooms = typeof rooms === "string" ? JSON.parse(rooms) : rooms;
    const parsedGroupTicket =
      typeof groupTicket === "string"
        ? JSON.parse(groupTicket)
        : groupTicket || null;

    // Calculate total rooms from parsed rooms
    const totalRooms =
      (parsedRooms?.sharing || 0) +
      (parsedRooms?.quad || 0) +
      (parsedRooms?.quint || 0) +
      (parsedRooms?.triple || 0) +
      (parsedRooms?.double || 0);

    const updatedPackage = await GroupTicketing.findByIdAndUpdate(
      id,
      {
        ...(logo && { logo }),
        ...(flightLogo && { flightLogo }),
        packageName,
        hotels: parsedHotels,
        transports: parsedTransports,
        rooms: parsedRooms,
        totalRooms,
        availableRooms: Number(availableRooms) || 0,
        days: Number(days) || 0,
        nightCount: nightCount || "0",
        notes: notes || "",
        ...(parsedGroupTicket && { groupTicket: parsedGroupTicket }),
      },
      { new: true, runValidators: true },
    );

    if (!updatedPackage) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Package updated successfully",
      package: updatedPackage,
    });
  } catch (error) {
    console.error("Error updating package:", error);
    res.status(500).json({
      success: false,
      message: "Error updating package",
      error: error.message,
    });
  }
};

// Delete a package
export const deletePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPackage = await GroupTicketing.findByIdAndDelete(id);

    if (!deletedPackage)
      return res
        .status(404)
        .json({ success: false, message: "Package not found" });

    res
      .status(200)
      .json({ success: true, message: "Package deleted successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error deleting package", error });
  }
};
