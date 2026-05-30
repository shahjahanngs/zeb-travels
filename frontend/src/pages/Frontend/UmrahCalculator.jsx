import React, { useState, useEffect, useMemo, useRef } from "react";
import axiosInstance from "../../api/axios";
import Select from "react-select";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import {
  CarFront,
  Bed,
  TicketsPlane,
  Plus,
  X,
  Calendar,
  Users,
  Plane,
  User,
  CalendarDays,
  Hotel,
  MapPin,
  Clock,
  Luggage,
  Coffee,
  Crown,
} from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import hotelApi from "../../api/hotelApi";
import { theme } from "../../theme/theme";

const formatDate = (date) => date.toISOString().split("T")[0];

// Helper: Calculate final price with margin for B2B (logged-in) and B2C (logged-out) users
const calculateFinalPrice = (basePrice, priceType, user, margins) => {
  // B2B: For logged-in users (agents), apply their specific margin
  if (user) {
    const marginType = user.marginType; // "Percentage" or "Amount"
    const marginPercent = user.flightMarginPercent;
    const marginAmount = user.flightMarginAmount;

    let finalPrice = basePrice;

    if (marginType === "Percentage" && marginPercent > 0) {
      // Add percentage margin
      const marginValue = (basePrice * marginPercent) / 100;
      finalPrice = basePrice + marginValue;
    } else if (marginType === "Amount" && marginAmount > 0) {
      // Add fixed amount margin
      finalPrice = basePrice + marginAmount;
    }

    return Math.round(finalPrice); // Round to nearest integer
  }

  // B2C: For logged-out users, apply type-specific margin
  if (!margins || !margins.umrahCalculator) return basePrice;

  const marginAmount = margins.umrahCalculator[priceType] || 0;
  return basePrice + marginAmount;
};

// Gold theme color
const GOLD = "#BA9932";
const GOLD_LIGHT = "rgba(186, 153, 50, 0.1)";
const GOLD_MEDIUM = "rgba(186, 153, 50, 0.5)";
const GOLD_GRADIENT = theme.colors.primary;

// Custom select styles with gold theme
const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: "42px",
    borderColor: state.isFocused ? GOLD : "#E5E7EB",
    boxShadow: state.isFocused ? `0 0 0 2px ${GOLD_MEDIUM}` : "none",
    "&:hover": {
      borderColor: GOLD,
    },
    borderRadius: "0.5rem",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? GOLD
      : state.isFocused
        ? GOLD_LIGHT
        : "white",
    color: state.isSelected ? "white" : "#1F2937",
    "&:active": {
      backgroundColor: GOLD,
    },
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: GOLD_LIGHT,
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: "#1F2937",
  }),
  multiValueRemove: (base) => ({
    ...base,
    "&:hover": {
      backgroundColor: GOLD,
      color: "white",
    },
  }),
};

const UmrahPackageCalculator = ({ user }) => {
  const { margins } = {};
  const notifySuccess = (param) => toast.success(param);
  const notifyError = (param) => toast.error(param);
  const [visaType, setVisaType] = useState("Select Visa Type");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const datePickersRef = useRef([]);

  const [transportList, setTransportList] = useState([
    { type: "", name: "", cost: 0 },
  ]);
  const [roomType, setRoomType] = useState("Private");
  const [hotelRooms, setHotelRooms] = useState([
    {
      city: "",
      hotel: "",
      rooms: 1,
      type: "",
      date: "",
      dateRange: {
        startDate: new Date(),
        endDate: new Date(),
        key: "selection",
      },
      nights: 0,
      showDatePicker: false,
    },
  ]);
  const [hotels, setHotels] = useState([]);
  const [visaOptions, setVisaOptions] = useState([]);
  const [transportOptions, setTransportOptions] = useState([]);
  const [umrahPackages, setUmrahPackages] = useState([]);

  const [isOpen, setIsOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedGroupModel, setSelectedGroupModel] = useState(false);
  const [passengerDetailsModalOpen, setPassengerDetailsModalOpen] =
    useState(false);
  const [passengerDetails, setPassengerDetails] = useState([]);
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const sectionId = location.hash.replace("#", "");
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location]);

  const [passengerCounts, setPassengerCounts] = useState({
    adults: 0,
    children: 0,
    infants: 0,
  });

  const handleSelectGroup = (groupId) => {
    const group = umrahPackages.find(
      (g) => g._id === groupId || g.id === groupId,
    );
    setSelectedGroup(group);
    setSelectedGroupId(groupId);
    setSelectedGroupModel(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPassengerCounts((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  // Helper functions for margin calculation - kept for backward compatibility
  const getVisaMargin = () => {
    if (user || !margins?.umrahCalculator) return 0;
    return margins.umrahCalculator.umrahVisa || 0;
  };

  const getTransportMargin = () => {
    if (user || !margins?.umrahCalculator) return 0;
    return margins.umrahCalculator.transport || 0;
  };

  const getHotelMargin = () => {
    if (user || !margins?.umrahCalculator) return 0;
    return margins.umrahCalculator.hotel || 0;
  };

  // Calculate transport price with B2B/B2C logic
  const calculateTransportPrice = (basePrice) => {
    return calculateFinalPrice(basePrice, "transport", user, margins);
  };

  // Calculate hotel price with B2B/B2C logic
  const calculateHotelPrice = (basePrice) => {
    return calculateFinalPrice(basePrice, "hotel", user, margins);
  };

  // Calculate total visa cost for all passengers, then apply margin once
  const calculateVisaTotalWithMargin = (
    visa,
    adultCount,
    childCount,
    infantCount,
  ) => {
    if (!visa) return 0;

    // Calculate base total for all passengers
    const baseTotal =
      adultCount * visa.adultVisaSelling +
      childCount * visa.childVisaSelling +
      infantCount * visa.infantVisaSelling;

    // Apply margin to the total, not per passenger
    return (
      calculateFinalPrice(baseTotal, "umrahVisa", user, margins) || baseTotal
    );
  };

  // Calculate total group ticket cost for all passengers, then apply margin once
  const calculateGroupTicketTotalWithMargin = (
    adultPrice,
    childPrice,
    adultCount,
    childCount,
  ) => {
    // Calculate base total for all passengers
    const baseTotal = adultCount * adultPrice + childCount * childPrice;

    // Apply margin to the total, not per passenger
    return (
      calculateFinalPrice(baseTotal, "groupTicket", user, margins) || baseTotal
    );
  };

  const calculateTotalPrice = () => {
    if (!selectedGroup) return 0;
    const { sellingPriceAdultB2B = 0, sellingPriceChildB2B = 0 } =
      selectedGroup.metadata;

    let total = 0;

    // Add group ticket costs - margin applied to total, not per passenger
    const groupTicketTotal = calculateGroupTicketTotalWithMargin(
      sellingPriceAdultB2B,
      sellingPriceChildB2B,
      passengerCounts.adults,
      passengerCounts.children,
    );
    total += groupTicketTotal;

    // Add visa costs - margin applied to total, not per passenger
    const visa = visaOptions.find((option) => option.visaName === visaType);
    if (visa) {
      const visaTotal = calculateVisaTotalWithMargin(
        visa,
        adults,
        children,
        infants,
      );
      total += visaTotal;
    }

    // Add transport costs with B2B/B2C margin
    const transportTotal = transportList.reduce((sum, t) => {
      const baseCost = Number(t.cost) || 0;
      const transportPrice = calculateTransportPrice(baseCost);
      return sum + (transportPrice || baseCost);
    }, 0);
    total += transportTotal;

    // Add hotel costs with B2B/B2C margin
    const hotelTotal = hotelRooms.reduce((sum, room) => {
      const roomPrice = Number(room.price) || 0;
      const hotelPrice = calculateHotelPrice(roomPrice);
      return sum + (hotelPrice || roomPrice) * room.rooms;
    }, 0);
    total += hotelTotal;

    return total.toLocaleString();
  };

  const calculateNights = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  useEffect(() => {
    const fetchVisaOptions = async () => {
      try {
        const response = await axiosInstance.get("/ummrah-visa");
        setVisaOptions(response.data || []);
      } catch (error) {
        console.error("Failed to fetch visa options", error);
      }
    };

    const fetchTranportData = async () => {
      try {
        let response;
        response = await axiosInstance.get("/transport-route-rates");
        const data = Array.isArray(response.data)
          ? response.data
          : response.data.data || [];
        setTransportOptions(data);
      } catch (error) {
        console.error("Failed to fetch transport data", error);
        setTransportOptions([]);
      }
    };

    const fetchHotels = async () => {
      try {
        const data = await hotelApi.getHotels();
        setHotels(data.data || []);
      } catch (error) {
        console.error("Failed to fetch hotels", error);
      }
    };

    const fetchUmrahPackages = async () => {
      try {
        const response = await axiosInstance.get("/sector/getUnifiedGroups");

        console.log("API Response:", response?.data);

        // actual array
        const packages = response?.data?.data || [];

        const transformedPackages = packages.map((pkg) => ({
          ...pkg,

          // normalize id
          _id: pkg.id,

          // normalize flights
          flights: pkg.details || [],

          // normalize seats
          seats: pkg.available_no_of_pax || 0,

          // normalize category
          groupCategory: pkg.type,

          // calculate days
          noOfDays: calculateDays(pkg.dept_date, pkg.arv_date),

          // normalized metadata
          metadata: {
            sellingPriceAdultB2B: pkg.price || 0,
            sellingPriceChildB2B: pkg.childPrice || 0,
            sellingPriceInfantB2B: pkg.infantPrice || 0,
            sellingCurrencyB2B: "PKR",
          },
        }));

        console.log("Transformed Packages:", transformedPackages);

        const filteredPackages = transformedPackages.filter(
          (item) => item.groupCategory === "Umrah Groups" && item.seats > 0,
        );

        setUmrahPackages(filteredPackages);
      } catch (error) {
        console.error("Error fetching Umrah packages:", error);
      }
    };

    const calculateDays = (deptDate, arvDate) => {
      const dept = new Date(deptDate);
      const arv = new Date(arvDate);
      const diffTime = Math.abs(arv - dept);
      const diffDays = Math.ceil(diffTime / (1001 * 60 * 60 * 24));
      return diffDays;
    };

    fetchHotels();
    fetchTranportData();
    fetchVisaOptions();
    fetchUmrahPackages();
  }, []);

  useEffect(() => {
    datePickersRef.current = hotelRooms.map(
      (_, i) => datePickersRef.current[i] || React.createRef(),
    );
    function handleClickOutside(event) {
      hotelRooms.forEach((room, idx) => {
        if (
          room.showDatePicker &&
          datePickersRef.current[idx] &&
          !datePickersRef.current[idx].contains(event.target)
        ) {
          toggleDatePicker(idx, false);
        }
      });
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [hotelRooms]);

  const handleAddTransport = () => {
    setTransportList([
      { name: "", type: "", cost: "", route: "" },
      ...transportList,
    ]);
  };

  const routeOptions = useMemo(() => {
    if (!Array.isArray(transportOptions) || transportOptions.length === 0)
      return [];
    const routes = transportOptions.map((item) => item.route).filter(Boolean);
    const uniqueRoutes = [...new Set(routes)];
    return uniqueRoutes.map((route) => ({ label: route, value: route }));
  }, [transportOptions]);

  const handleTransportChange = (index, field, value) => {
    setTransportList((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;

        const updatedItem = { ...item, [field]: value };

        const { route, type } = updatedItem;

        if ((field === "route" || field === "type") && route && type) {
          const matched = Array.isArray(transportOptions)
            ? transportOptions.find(
                (opt) => opt.route === route && opt.selectTransport === type,
              )
            : null;
          // Add margin for B2C users
          const baseRate = matched ? matched.buyingRate : 0;
          const transportMargin = getTransportMargin();
          updatedItem.cost = baseRate + transportMargin;
        } else if (field === "route") {
          updatedItem.type = "";
          updatedItem.cost = "";
        }

        return updatedItem;
      }),
    );
  };

  let uniqueCities = [];

  if (Array.isArray(hotels)) {
    uniqueCities = [
      ...new Set(
        hotels.map((hotel) => hotel.location?.city).filter((city) => city),
      ),
    ];
  }

  const handleRoomChange = (index, field, value, availableRoomTypes = []) => {
    const updatedRooms = [...hotelRooms];

    if (field === "dateRange") {
      updatedRooms[index].dateRange = value;
      updatedRooms[index].date =
        `${value.startDate.toLocaleDateString()} to ${value.endDate.toLocaleDateString()}`;
      updatedRooms[index].nights = calculateNights(
        value.startDate,
        value.endDate,
      );
    } else {
      updatedRooms[index][field] = value;

      if (field === "city") {
        updatedRooms[index].hotel = "";
        updatedRooms[index].type = "";
        updatedRooms[index].price = "";
      }

      if (field === "hotel") {
        updatedRooms[index].type = "";
        updatedRooms[index].price = "";
      }

      if (field === "type") {
        const selectedType = availableRoomTypes.find(
          (r) => r.roomType === value,
        );
        // Add margin for B2C users
        const basePrice = selectedType?.sellingPrice || 0;
        const hotelMargin = getHotelMargin();
        updatedRooms[index].price = basePrice + hotelMargin;
      }
    }

    setHotelRooms(updatedRooms);
  };

  const toggleDatePicker = (index, forceValue = null) => {
    const updatedRooms = [...hotelRooms];
    updatedRooms[index].showDatePicker =
      forceValue !== null ? forceValue : !updatedRooms[index].showDatePicker;
    setHotelRooms(updatedRooms);
  };

  const addRoom = () => {
    setHotelRooms([
      ...hotelRooms,
      {
        city: "",
        hotel: "",
        rooms: 1,
        type: "",
        date: "",
        dateRange: {
          startDate: new Date(),
          endDate: new Date(),
          key: "selection",
        },
        showDatePicker: false,
      },
    ]);
  };

  const handleRemoveTransport = (index) => {
    const newList = [...transportList];
    newList.splice(index, 1);
    setTransportList(newList);
  };

  const selectedVisa = Array.isArray(visaOptions)
    ? visaOptions.find((option) => option.visaName === visaType)
    : undefined;

  const removeRoom = (indexToRemove) => {
    const updatedRooms = hotelRooms.filter((_, i) => i !== indexToRemove);
    setHotelRooms(updatedRooms);
  };

  const handleSubmit = () => {
    const visa = visaOptions.find((option) => option.visaName === visaType);

    if (selectedGroupId === null) {
      notifyError("Please select group ticket.");
      return;
    }

    if (
      !passengerDetails ||
      passengerDetails.length === 0 ||
      passengerDetails.some(
        (p) =>
          !p.givenName?.trim() ||
          !p.surName?.trim() ||
          !p.passport?.trim() ||
          !p.passportExpiry ||
          !p.dateOfBirth ||
          !p.nationality?.trim(),
      )
    ) {
      notifyError("Please fill all passenger details before submitting.");
      return;
    }

    if (!visaType || visaType === "Select Visa Type") {
      notifyError("Please select a visa type.");
      return;
    }

    if (!hotelRooms || hotelRooms.length === 0 || !hotelRooms[0].city) {
      notifyError("Please add at least one hotel room.");
      return;
    }

    const totalCost = calculateTotalPrice();

    // Check if user is logged out (B2C)
    const isB2C = !user;

    // Determine endpoint based on user status
    const endpoint = isB2C ? "/umrah-calculator/public" : "/umrah-calculator/";

    // Calculate prices with margins for payload
    const visaMargin = getVisaMargin();
    const transportMargin = getTransportMargin();
    const hotelMargin = getHotelMargin();

    // Calculate group ticket total with margin applied once (not per passenger)
    const groupTicketTotalWithMargin = calculateGroupTicketTotalWithMargin(
      selectedGroup?.metadata?.sellingPriceAdultB2B || 0,
      selectedGroup?.metadata?.sellingPriceChildB2B || 0,
      passengerCounts.adults,
      passengerCounts.children,
    );

    // Calculate per-passenger prices with margin distributed proportionally
    const baseAdultPrice = selectedGroup?.metadata?.sellingPriceAdultB2B || 0;
    const baseChildPrice = selectedGroup?.metadata?.sellingPriceChildB2B || 0;
    const baseTotal =
      passengerCounts.adults * baseAdultPrice +
      passengerCounts.children * baseChildPrice;

    let adultPriceWithMargin = baseAdultPrice;
    let childPriceWithMargin = baseChildPrice;

    if (baseTotal > 0 && groupTicketTotalWithMargin > 0) {
      const ratio = groupTicketTotalWithMargin / baseTotal;
      adultPriceWithMargin = Math.round(baseAdultPrice * ratio);
      childPriceWithMargin = Math.round(baseChildPrice * ratio);
    }

    // Calculate visa total with margin applied once (not per passenger)
    const visaTotalWithMargin = calculateVisaTotalWithMargin(
      visa,
      adults,
      children,
      infants,
    );

    const payload = {
      visaType,
      selectedGroup: selectedGroupId,
      passengerDetails,
      passengerCounts,
      totalCost,
      // Include calculated group ticket total with margin applied once
      groupTicketPricing: {
        totalPrice: groupTicketTotalWithMargin, // Total with margin applied once
        adultBasePrice: adultPriceWithMargin, // Price per adult WITH margin
        childBasePrice: childPriceWithMargin, // Price per child WITH margin
        infantPrice: 0,
        currency: selectedGroup?.metadata?.sellingCurrencyB2B || "PKR",
      },
      visaDetails: {
        adults,
        children,
        infants,
        adultVisaSelling: visa?.adultVisaSelling || 0, // Base prices for reference
        childVisaSelling: visa?.childVisaSelling || 0,
        infantVisaSelling: visa?.infantVisaSelling || 0,
        totalVisaCost: visaTotalWithMargin, // Total with margin applied once
      },
      transportList: transportList.map((t) => ({
        route: t.route,
        selectTransport: t.type,
        buyingRate:
          calculateTransportPrice(Number(t.cost) || 0) || Number(t.cost) || 0,
      })),
      roomType,
      hotelRooms: hotelRooms.map((room) => ({
        city: room.city,
        hotel: room.hotel,
        rooms: +room.rooms,
        type: room.type,
        startDate: formatDate(room.dateRange.startDate),
        endDate: formatDate(room.dateRange.endDate),
        pricePerRoom: calculateHotelPrice(room.price) || room.price,
        totalCost: (calculateHotelPrice(room.price) || room.price) * room.rooms,
      })),
    };

    // Add contact info for B2C users
    if (isB2C && passengerDetails.length > 0) {
      // Use first passenger's details as contact
      payload.contactEmail = passengerDetails[0].email || "";
      payload.contactPhone = passengerDetails[0].phone || "";
    }

    axiosInstance
      .post(endpoint, payload)
      .then((response) => {
        const message = isB2C
          ? response.data.message ||
            "Booking inquiry submitted! Our team will contact you soon."
          : "Form submitted successfully!";
        notifySuccess(message);
        setSelectedGroupId(null);

        // Redirect based on user type
        setTimeout(() => {
          if (isB2C) {
            window.location.href = "/umrah-calculator";
          } else {
            window.location.href =
              "/dashboard/my-umrah-calculator?status=pending";
          }
        }, 2000);
      })
      .catch((error) => {
        if (error.response) {
          notifyError(
            "Save failed: " + (error.response.data?.message || "Unknown error"),
          );
          console.error("Save failed:", error.response.data);
        } else if (error.request) {
          notifyError("No response from server.");
          console.error("No response from server:", error.request);
        } else {
          notifyError("Error: " + error.message);
          console.error("Error:", error.message);
        }
      });
  };

  return (
    <>
      <div className="min-h-screen bg-linear-to-b from-gray-50 to-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Main Card */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
            {/* Gold Accent Header */}
            <div className="h-2" style={{ background: GOLD_GRADIENT }}></div>

            <div className="p-6 md:p-10">
              {/* Visa Details Section */}
              <div className="mb-10 pb-8 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="p-3 rounded-xl"
                    style={{ background: GOLD_GRADIENT }}
                  >
                    <TicketsPlane
                      className="w-6 h-6"
                      style={{ color: "white" }}
                    />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900">
                    Visa Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Visa Type
                    </label>
                    <Select
                      styles={customSelectStyles}
                      options={
                        Array.isArray(visaOptions)
                          ? visaOptions
                              .filter((item) =>
                                item.visaName.toLowerCase().includes("umrah"),
                              )
                              .map((item) => ({
                                value: item.visaName,
                                label: item.visaName
                                  .replace(/([A-Z])/g, " $1")
                                  .replace(/^./, (str) => str.toUpperCase()),
                              }))
                          : []
                      }
                      value={
                        visaType
                          ? {
                              value: visaType,
                              label: visaType
                                .replace(/([A-Z])/g, " $1")
                                .replace(/^./, (str) => str.toUpperCase()),
                            }
                          : null
                      }
                      onChange={(selected) => setVisaType(selected.value)}
                      placeholder="Select Visa Type"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adults
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={adults}
                      onChange={(e) => setAdults(+e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-opacity-50 transition-all duration-200"
                      style={{ focusRingColor: GOLD }}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Children
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={children}
                      onChange={(e) => setChildren(+e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-opacity-50 transition-all duration-200"
                      style={{ focusRingColor: GOLD }}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Infants
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={infants}
                      onChange={(e) => setInfants(+e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-opacity-50 transition-all duration-200"
                      style={{ focusRingColor: GOLD }}
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adult
                    </label>
                    <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium">
                      {selectedVisa?.adultVisaSelling || 0}
                    </div>
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Child
                    </label>
                    <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium">
                      {selectedVisa?.childVisaSelling || 0}
                    </div>
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Infant
                    </label>
                    <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium">
                      {selectedVisa?.infantVisaSelling || 0}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Visa Cost
                    </label>
                    <div
                      className="px-4 py-2.5 rounded-xl text-white font-semibold"
                      style={{ background: GOLD_GRADIENT }}
                    >
                      {selectedVisa
                        ? calculateVisaTotalWithMargin(
                            selectedVisa,
                            adults,
                            children,
                            infants,
                          )
                        : 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Transport Section */}
              <div className="mb-10 pb-8 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="p-3 rounded-xl"
                    style={{ background: GOLD_GRADIENT }}
                  >
                    <CarFront className="w-6 h-6" style={{ color: "white" }} />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900">
                    Private Transport
                  </h3>
                </div>

                {/* Header Labels - Add this section */}
                <div className="hidden md:grid grid-cols-12 gap-4 mb-2 px-4">
                  <div className="md:col-span-4 text-sm font-medium text-gray-600">
                    Route
                  </div>
                  <div className="md:col-span-4 text-sm font-medium text-gray-600">
                    Transport Type
                  </div>
                  <div className="md:col-span-3 text-sm font-medium text-gray-600">
                    Final Price
                  </div>
                  <div className="md:col-span-1"></div>
                </div>

                <div className="space-y-4">
                  {/* Additional Transport Items */}
                  {transportList.slice(1).map((item, index) => (
                    <div
                      key={index + 1}
                      className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 rounded-xl"
                    >
                      <div className="md:col-span-4">
                        <label className="block text-xs font-medium text-gray-500 mb-1 md:hidden">
                          Route
                        </label>
                        <Select
                          styles={customSelectStyles}
                          options={routeOptions}
                          value={routeOptions.find(
                            (opt) => opt.value === item.route,
                          )}
                          onChange={(selected) =>
                            handleTransportChange(
                              index + 1,
                              "route",
                              selected.value,
                            )
                          }
                          placeholder="Select Route"
                        />
                      </div>

                      <div className="md:col-span-4">
                        <label className="block text-xs font-medium text-gray-500 mb-1 md:hidden">
                          Transport Type
                        </label>
                        <Select
                          styles={customSelectStyles}
                          options={transportOptions
                            .filter((opt) => opt.route === item.route)
                            .map((opt) => ({
                              value: opt.selectTransport,
                              label: opt.selectTransport,
                            }))}
                          value={{
                            value: item.type,
                            label: item.type,
                          }}
                          onChange={(selected) =>
                            handleTransportChange(
                              index + 1,
                              "type",
                              selected?.value || "",
                            )
                          }
                          placeholder="Select Transport Type"
                          isDisabled={!item.route}
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-xs font-medium text-gray-500 mb-1 md:hidden">
                          Price
                        </label>
                        <div className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium text-center">
                          {(
                            calculateTransportPrice(Number(item.cost) || 0) || 0
                          ).toLocaleString()}
                        </div>
                      </div>

                      <div className="md:col-span-1">
                        <button
                          onClick={() => handleRemoveTransport(index + 1)}
                          className="w-full h-10.5S bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all duration-200 flex items-center justify-center"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* First Transport Item */}
                  {transportList.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 rounded-xl">
                      <div className="md:col-span-4">
                        <label className="block text-xs font-medium text-gray-700 mb-1 md:hidden">
                          Route
                        </label>
                        <Select
                          styles={customSelectStyles}
                          options={routeOptions}
                          value={routeOptions.find(
                            (opt) => opt.value === transportList[0].route,
                          )}
                          onChange={(selected) =>
                            handleTransportChange(0, "route", selected.value)
                          }
                          placeholder="Select Route"
                        />
                      </div>

                      <div className="md:col-span-4">
                        <label className="block text-xs font-medium text-gray-700 mb-1 md:hidden">
                          Transport Type
                        </label>
                        <Select
                          styles={customSelectStyles}
                          options={transportOptions
                            .filter(
                              (opt) => opt.route === transportList[0].route,
                            )
                            .map((opt) => ({
                              value: opt.selectTransport,
                              label: opt.selectTransport,
                            }))}
                          value={{
                            value: transportList[0].type,
                            label: transportList[0].type,
                          }}
                          onChange={(selected) =>
                            handleTransportChange(
                              0,
                              "type",
                              selected?.value || "",
                            )
                          }
                          placeholder="Select Transport Type"
                          isDisabled={!transportList[0].route}
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-xs font-medium text-gray-700 mb-1 md:hidden">
                          Price
                        </label>
                        <div className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium text-center">
                          {(
                            calculateTransportPrice(
                              Number(transportList[0].cost) || 0,
                            ) || 0
                          ).toLocaleString()}
                        </div>
                      </div>

                      <div className="md:col-span-1">
                        <button
                          onClick={handleAddTransport}
                          className="w-full h-10.5 rounded-xl text-white transition-all duration-200 flex items-center justify-center gap-2"
                          style={{ background: GOLD_GRADIENT }}
                        >
                          <Plus size={18} />
                          <span className="hidden md:inline">Add</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Group Tickets Button */}
              <div className="mb-8">
                <button
                  onClick={() => setIsOpen(true)}
                  className="group relative px-6 py-3 rounded-xl text-white font-medium overflow-hidden transition-all duration-300 hover:shadow-lg"
                  style={{ background: GOLD_GRADIENT }}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Plane className="w-5 h-5" />
                    Browse Group Tickets
                  </span>
                </button>
              </div>

              {/* Selected Group Display */}
              {selectedGroup && (
                <div className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: GOLD_LIGHT }}
                      >
                        <Crown className="w-5 h-5" style={{ color: GOLD }} />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {selectedGroup.airline?.airline_name ||
                          selectedGroup.airline?.airlineName}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-gray-200 rounded-full text-sm font-medium">
                        {selectedGroup.noOfDays} Days
                      </span>
                      <span
                        className="text-xl font-bold"
                        style={{ color: GOLD }}
                      >
                        {selectedGroup.metadata?.sellingCurrencyB2B || "PKR"}{" "}
                        {calculateTotalPrice()}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedGroup(null);
                          setSelectedGroupId(null);
                          setPassengerCounts({
                            adults: 0,
                            children: 0,
                            infants: 0,
                          });
                          setPassengerDetails([]);
                          notifySuccess("Group ticket selection cleared.");
                        }}
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-900">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Flight
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Departure
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Arrival
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Meal
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Baggage
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(
                          selectedGroup.flights ||
                          selectedGroup.details ||
                          []
                        ).map((flight, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-3 whitespace-nowrap font-medium">
                              {flight.flight_no || flight.flightNo}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span>
                                  {new Date(
                                    flight.dep_date || flight.depDate,
                                  ).toLocaleDateString()}{" "}
                                  {flight.dept_time || flight.depTime}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span>
                                  {new Date(
                                    flight.arv_date || flight.arrDate,
                                  ).toLocaleDateString()}{" "}
                                  {flight.arv_time || flight.arrTime}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <Coffee className="w-4 h-4 text-gray-400" />
                                <span>
                                  {flight.meal === "Yes"
                                    ? "Included"
                                    : "Not Included"}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <Luggage className="w-4 h-4 text-gray-400" />
                                <span>{flight.baggage}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Hotel Rooms Section */}
              <div className="mb-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-3 rounded-xl"
                      style={{ background: GOLD_GRADIENT }}
                    >
                      <Bed className="w-6 h-6" style={{ color: "white" }} />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900">
                      Hotel Accommodation
                    </h3>
                  </div>

                  <div className="flex gap-3">
                    {["Private", "Sharing"].map((type) => (
                      <button
                        key={type}
                        onClick={() => setRoomType(type)}
                        className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                          roomType === type
                            ? "text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                        style={
                          roomType === type ? { background: GOLD_GRADIENT } : {}
                        }
                      >
                        {type} Room
                      </button>
                    ))}
                  </div>
                </div>

                {/* --- Header Section --- */}
                <div
                  className="hidden md:grid grid-cols-12 gap-4 items-center text-white text-sm font-semibold px-6 py-3 rounded-lg mb-3"
                  style={{
                    background: GOLD_GRADIENT,
                  }}
                >
                  <div className="col-span-2 text-left">Location</div>
                  <div className="col-span-2 text-left">Hotel</div>
                  <div className="col-span-3 text-center">Select Dates</div>
                  <div className="col-span-1 text-center">Nights</div>
                  <div className="col-span-1 text-center">Rooms</div>
                  <div className="col-span-2 text-left px-2">Room Type</div>
                  <div className="col-span-1 text-center">Price</div>
                </div>

                {/* --- Inputs Section --- */}
                <div className="space-y-4">
                  {hotelRooms.map((room, index) => {
                    const hotelsArray = Array.isArray(hotels) ? hotels : [];
                    const filteredHotels = hotelsArray.filter(
                      (h) => h.location?.city === room.city,
                    );
                    const selectedHotel = hotelsArray.find(
                      (h) => room.hotel && h.name === room.hotel,
                    );

                    // Get available room types from the selected hotel
                    let availableRoomTypes = [];
                    if (
                      selectedHotel &&
                      Array.isArray(selectedHotel.roomOptions)
                    ) {
                      availableRoomTypes = selectedHotel.roomOptions.map(
                        (room) => ({
                          roomType: room.name,
                          sellingPrice: room.sellingPricePerNight,
                          buyingPrice: room.buyingPricePerNight,
                        }),
                      );
                    }

                    return (
                      <div
                        key={index}
                        className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow items-center"
                      >
                        {/* Location */}
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-500 mb-1 md:hidden">
                            City
                          </label>
                          <Select
                            styles={customSelectStyles}
                            value={
                              uniqueCities
                                .map((city) => ({ value: city, label: city }))
                                .find((option) => option.value === room.city) ||
                              null
                            }
                            onChange={(selectedOption) =>
                              handleRoomChange(
                                index,
                                "city",
                                selectedOption?.value || "",
                              )
                            }
                            options={uniqueCities.map((city) => ({
                              value: city,
                              label: city,
                            }))}
                            placeholder="Select City"
                          />
                        </div>

                        {/* Hotel */}
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-500 mb-1 md:hidden">
                            Hotel
                          </label>
                          <Select
                            styles={customSelectStyles}
                            value={
                              filteredHotels
                                .map((hotel) => ({
                                  value: hotel.name,
                                  label: hotel.name,
                                }))
                                .find(
                                  (option) => option.value === room.hotel,
                                ) || null
                            }
                            onChange={(selectedOption) =>
                              handleRoomChange(
                                index,
                                "hotel",
                                selectedOption?.value || "",
                              )
                            }
                            options={filteredHotels.map((hotel) => ({
                              value: hotel.name,
                              label: hotel.name,
                            }))}
                            isDisabled={!room.city}
                            placeholder="Select Hotel"
                          />
                        </div>

                        {/* Dates */}
                        <div className="md:col-span-3 relative">
                          <label className="block text-xs font-medium text-gray-500 mb-1 md:hidden">
                            Dates
                          </label>
                          <button
                            type="button"
                            onClick={() => toggleDatePicker(index)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl text-left flex items-center justify-between hover:border-gray-300 transition-colors h-9.5"
                          >
                            <span className="truncate text-sm">
                              {room.date ? room.date : "Select dates"}
                            </span>
                            <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                          </button>

                          {room.showDatePicker && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => toggleDatePicker(index, false)}
                              />
                              <div
                                ref={(el) =>
                                  (datePickersRef.current[index] = el)
                                }
                                className="fixed z-50"
                                style={{
                                  top: "50%",
                                  left: "50%",
                                  transform: "translate(-50%, -50%)",
                                }}
                              >
                                <div className="relative">
                                  <button
                                    onClick={() =>
                                      toggleDatePicker(index, false)
                                    }
                                    className="absolute -top-10 right-0 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors z-10"
                                  >
                                    <X size={20} />
                                  </button>
                                  <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
                                    <DateRange
                                      editableDateInputs={true}
                                      onChange={(item) =>
                                        handleRoomChange(
                                          index,
                                          "dateRange",
                                          item.selection,
                                        )
                                      }
                                      moveRangeOnFirstSelection={false}
                                      ranges={[room.dateRange]}
                                      className="shadow-none"
                                    />
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Nights */}
                        <div className="md:col-span-1">
                          <label className="block text-xs font-medium text-gray-500 mb-1 md:hidden">
                            Nights
                          </label>
                          <input
                            type="number"
                            value={room.nights || ""}
                            readOnly
                            className="w-full h-9.5 border border-gray-200 rounded-xl bg-gray-50 text-center text-sm"
                          />
                        </div>

                        {/* Rooms Count */}
                        <div className="md:col-span-1">
                          <label className="block text-xs font-medium text-gray-500 mb-1 md:hidden">
                            Rooms
                          </label>
                          <input
                            type="number"
                            value={room.rooms}
                            min={1}
                            onChange={(e) =>
                              handleRoomChange(index, "rooms", e.target.value)
                            }
                            className="w-full h-9.5 border border-gray-200 rounded-xl text-center text-sm focus:ring-2 focus:ring-opacity-50"
                          />
                        </div>

                        {/* Room Type */}
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-500 mb-1 md:hidden">
                            Room Type
                          </label>
                          <Select
                            styles={customSelectStyles}
                            value={
                              availableRoomTypes
                                .map((t) => ({
                                  value: t.roomType,
                                  label: t.roomType,
                                }))
                                .find((o) => o.value === room.type) || null
                            }
                            onChange={(opt) =>
                              handleRoomChange(
                                index,
                                "type",
                                opt?.value || "",
                                availableRoomTypes,
                              )
                            }
                            options={availableRoomTypes.map((t) => ({
                              value: t.roomType,
                              label: t.roomType,
                            }))}
                            isDisabled={
                              !room.hotel || availableRoomTypes.length === 0
                            }
                            placeholder={
                              !room.hotel ? "Select hotel" : "Select room"
                            }
                          />
                        </div>

                        {/* Price & Delete */}
                        <div className="md:col-span-1 flex items-center gap-2">
                          <div
                            className="w-full h-9.5 flex items-center justify-center rounded-xl text-white font-medium text-sm"
                            style={{ background: GOLD_GRADIENT }}
                          >
                            {room.price
                              ? (
                                  (calculateHotelPrice(room.price) ||
                                    room.price) * room.rooms
                                ).toLocaleString()
                              : "0"}
                          </div>
                          {index !== 0 && (
                            <button
                              onClick={() => removeRoom(index)}
                              className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <button
                    onClick={addRoom}
                    className="px-6 py-3 rounded-xl text-white font-medium transition-all duration-300 hover:shadow-lg flex items-center gap-2 mt-4"
                    style={{ background: GOLD_GRADIENT }}
                  >
                    <Plus className="w-5 h-5" />
                    Add Another Room
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="text-center mt-10">
                <button
                  onClick={handleSubmit}
                  className="group relative px-8 py-4 rounded-xl text-white font-semibold text-lg overflow-hidden transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1"
                  style={{ background: GOLD_GRADIENT }}
                >
                  <span className="relative z-10">Submit Your Request</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Group Tickets Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">
                Available Group Tickets
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              {umrahPackages.map((group) => {
                const airline =
                  group.airline?.airline_name?.toLowerCase() || "";

                return (
                  <div
                    key={group._id}
                    className="mb-6 border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 border-b border-gray-100 bg-gray-50">
                      <div className="flex items-center gap-3">
                        {airline.includes("flydubai") && (
                          <img
                            style={{ height: "80px" }}
                            src={group.airline?.logo_url}
                            alt={group.airline?.airline_name}
                            className="h-8 w-auto object-contain"
                          />
                        )}
                        <span
                          className="font-semibold text-lg"
                          style={{ color: GOLD }}
                        >
                          {group.airline?.airline_name}
                        </span>
                      </div>
                      <span className="px-2 py-1 bg-gray-200 rounded-full text-xs font-medium">
                        UMRAH GROUP
                      </span>
                      <span className="md:ml-auto px-3 py-1 bg-gray-900 text-white rounded-full text-sm">
                        {group.sector || ""}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Date
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Days
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Flight
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Sector
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Time
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Seats
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Baggage
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Meal
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {group.flights.map((flight, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap">
                                {flight.flight_date
                                  ? new Date(
                                      flight.flight_date,
                                    ).toLocaleDateString()
                                  : "-"}
                              </td>

                              <td className="px-4 py-3 whitespace-nowrap">
                                {group.noOfDays || "-"}
                              </td>

                              <td className="px-4 py-3 whitespace-nowrap font-mono">
                                {flight.flight_no || "-"}
                              </td>

                              <td className="px-4 py-3 whitespace-nowrap">
                                {flight.origin} - {flight.destination}
                              </td>

                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs">
                                  {flight.dept_time || "-"}
                                </span>

                                <span className="mx-1">→</span>

                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs">
                                  {flight.arv_time || "-"}
                                </span>
                              </td>

                              <td className="px-4 py-3 whitespace-nowrap text-center font-medium">
                                {group.seats || 0}
                              </td>

                              <td className="px-4 py-3 whitespace-nowrap">
                                {flight.baggage || "-"}
                              </td>

                              <td className="px-4 py-3 whitespace-nowrap">
                                {flight.meal === "Yes" ? (
                                  <span className="text-green-600">
                                    ✓ Included
                                  </span>
                                ) : (
                                  <span className="text-red-600">
                                    ✗ Not Included
                                  </span>
                                )}
                              </td>

                              <td className="px-4 py-3 whitespace-nowrap">
                                {idx === group.flights.length - 1 && (
                                  <div className="flex flex-col items-end gap-2">
                                    <span
                                      className="font-bold text-lg"
                                      style={{ color: GOLD }}
                                    >
                                      {`${group.metadata?.sellingCurrencyB2B || "PKR"} ${Number(
                                        calculateFinalPrice(
                                          group.metadata?.sellingPriceAdultB2B,
                                          "groupTicket",
                                          user,
                                          margins,
                                        ) ||
                                          group.metadata
                                            ?.sellingPriceAdultB2B ||
                                          0,
                                      ).toLocaleString()}`}
                                    </span>

                                    <button
                                      className={`px-4 py-2 rounded-lg text-white font-medium text-sm transition-all ${
                                        selectedGroupId === group._id ||
                                        group.seats === 0
                                          ? "bg-gray-400 cursor-not-allowed"
                                          : "hover:shadow-md"
                                      }`}
                                      style={
                                        selectedGroupId !== group._id &&
                                        group.seats > 0
                                          ? { background: GOLD_GRADIENT }
                                          : {}
                                      }
                                      onClick={() =>
                                        handleSelectGroup(group._id)
                                      }
                                      disabled={
                                        selectedGroupId === group._id ||
                                        group.seats === 0 ||
                                        group.seats < 1
                                      }
                                    >
                                      {group.seats === 0
                                        ? "Fully Booked"
                                        : selectedGroupId === group._id
                                          ? "Selected"
                                          : "Select Now"}
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end p-6 border-t border-gray-100">
              <button
                onClick={() => setIsOpen(false)}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Passenger Count Modal */}
      {selectedGroupModel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Passenger Details
              </h3>
              <button
                onClick={() => setSelectedGroupModel(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adults
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    min={0}
                    name="adults"
                    value={passengerCounts.adults}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-opacity-50 transition-all"
                    style={{ focusRingColor: GOLD }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Children
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    min={0}
                    name="children"
                    value={passengerCounts.children}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-opacity-50 transition-all"
                    style={{ focusRingColor: GOLD }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Infants
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    min={0}
                    name="infants"
                    value={passengerCounts.infants}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-opacity-50 transition-all"
                    style={{ focusRingColor: GOLD }}
                  />
                </div>
              </div>
            </div>

            <div
              className="p-4 rounded-xl mb-6"
              style={{ backgroundColor: GOLD_LIGHT }}
            >
              <p className="text-sm text-gray-600">Total Price</p>
              <p className="text-2xl font-bold" style={{ color: GOLD }}>
                {selectedGroup?.metadata?.sellingCurrencyB2B}{" "}
                {typeof calculateTotalPrice() === "string"
                  ? calculateTotalPrice()
                  : calculateTotalPrice().toLocaleString()}
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setSelectedGroup(null);
                  setSelectedGroupModel(false);
                  window.location.reload();
                  setPassengerCounts({ adults: 0, children: 0, infants: 0 });
                }}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const totalPax =
                    Number(passengerCounts.adults || 0) +
                    Number(passengerCounts.children || 0) +
                    Number(passengerCounts.infants || 0);
                  const details = [];
                  for (let i = 0; i < totalPax; i++) {
                    details.push({
                      type:
                        i < passengerCounts.adults
                          ? "Adult"
                          : i <
                              passengerCounts.adults + passengerCounts.children
                            ? "Child"
                            : "Infant",
                      title: "Mr",
                      givenName: "",
                      surName: "",
                      passport: "",
                      dateOfBirth: "",
                      passportExpiry: "",
                      nationality: "",
                    });
                  }
                  setPassengerDetails(details);
                  setSelectedGroupModel(false);
                  setPassengerDetailsModalOpen(true);
                }}
                className="px-4 py-2 rounded-lg text-white font-medium transition-colors hover:shadow-md"
                style={{ background: GOLD_GRADIENT }}
              >
                Next: Passenger Info
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Passenger Details Modal */}
      {passengerDetailsModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Passenger Information
              </h3>
              <button
                onClick={() => setPassengerDetailsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {passengerDetails.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No passengers to collect details for.
                </div>
              ) : (
                passengerDetails.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="p-1.5 rounded-lg"
                        style={{ backgroundColor: GOLD_LIGHT }}
                      >
                        <User className="w-4 h-4" style={{ color: GOLD }} />
                      </div>
                      <span className="font-semibold">
                        Passenger {idx + 1} — {p.type}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Title
                        </label>
                        <select
                          value={p.title}
                          onChange={(e) => {
                            const copy = [...passengerDetails];
                            copy[idx].title = e.target.value;
                            setPassengerDetails(copy);
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                        >
                          <option value="Mr">Mr</option>
                          <option value="Mrs">Mrs</option>
                          <option value="Ms">Ms</option>
                          <option value="Mstr">Mstr</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Given Name
                        </label>
                        <input
                          type="text"
                          placeholder="First name"
                          value={p.givenName}
                          onChange={(e) => {
                            const copy = [...passengerDetails];
                            copy[idx].givenName = e.target.value;
                            setPassengerDetails(copy);
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Surname
                        </label>
                        <input
                          type="text"
                          placeholder="Last name"
                          value={p.surName}
                          onChange={(e) => {
                            const copy = [...passengerDetails];
                            copy[idx].surName = e.target.value;
                            setPassengerDetails(copy);
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Passport Number
                        </label>
                        <input
                          type="text"
                          placeholder="Enter passport number"
                          value={p.passport}
                          onChange={(e) => {
                            const copy = [...passengerDetails];
                            copy[idx].passport = e.target.value;
                            setPassengerDetails(copy);
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          value={p.dateOfBirth}
                          onChange={(e) => {
                            const copy = [...passengerDetails];
                            copy[idx].dateOfBirth = e.target.value;
                            setPassengerDetails(copy);
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Passport Expiry
                        </label>
                        <input
                          type="date"
                          value={p.passportExpiry}
                          onChange={(e) => {
                            const copy = [...passengerDetails];
                            copy[idx].passportExpiry = e.target.value;
                            setPassengerDetails(copy);
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Nationality
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Pakistani"
                          value={p.nationality}
                          onChange={(e) => {
                            const copy = [...passengerDetails];
                            copy[idx].nationality = e.target.value;
                            setPassengerDetails(copy);
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setPassengerDetailsModalOpen(false);
                  window.location.reload();
                }}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const missing = passengerDetails.some(
                    (p) =>
                      !p.givenName?.trim() ||
                      !p.surName?.trim() ||
                      !p.passport?.trim() ||
                      !p.passportExpiry ||
                      !p.dateOfBirth ||
                      !p.nationality?.trim(),
                  );
                  if (missing) {
                    toast.error("Please fill all passenger details.");
                    return;
                  }
                  setPassengerDetailsModalOpen(false);
                  notifySuccess("Passenger details saved successfully!");
                }}
                className="px-4 py-2 rounded-lg text-white font-medium transition-colors hover:shadow-md"
                style={{ background: GOLD_GRADIENT }}
              >
                Save & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </>
  );
};

export default UmrahPackageCalculator;
