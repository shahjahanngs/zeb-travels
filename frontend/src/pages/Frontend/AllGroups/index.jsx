import React, { useEffect, useState, useContext } from "react";
import { FaRegCopy, FaCheck } from "react-icons/fa";
import { DashboardUIContext } from "../../../components/Dashboard/DashboardLayout";
import { Menu, Package } from "lucide-react";
import { FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../api/axios";
import { toast } from "react-toastify";
import MaskedDatePicker from "../../../components/MaskedDatePicker";
import { theme } from "../../../theme/theme";
import TopBar from "../../../components/TopBar/TopBar";
import { generateUmrahPackagesPDF } from "../../../utils/umrahPDFGen";

export default function AllGroups({
  headerType,
  header,
  searchParams,
  user,
  flat = false,
}) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedRow, setCopiedRow] = useState({});
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    if (filteredGroups.length === 0) {
      toast.warning("No packages available to download");
      return;
    }

    setDownloadingPDF(true);
    try {
      const userInfo = {
        name: user?.name || "",
        email: user?.email || "",
      };

      await generateUmrahPackagesPDF(filteredGroups, userInfo);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF download failed:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setDownloadingPDF(false);
    }
  };

  const MONTHS_TITLE = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const buildCopyText = (groupsList) => {
    if (!groupsList.length) return "";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const headerText = `                *=====${String(today.getDate()).padStart(2, "0")} ${MONTHS_TITLE[today.getMonth()].toUpperCase()} UPDATES=====*`;
    const lines = groupsList
      .map((g) => {
        const flight = g.flights?.[0];
        if (!flight) return null;
        const minPrice = Math.min(
          ...Object.values(g.rooms || {}).filter(Boolean),
        );
        const price = isFinite(minPrice) ? minPrice : 0;
        return `${flight.flightNo} *${g.packageName}* ${flight.sectorFrom} → ${flight.sectorTo}..... *PKR ${price.toLocaleString()}*`;
      })
      .filter(Boolean);
    const footer = `*ALL GROUPS ARE NON REFUNDABLE AND NON CHANGEABLE*\n=======================\nZEB Travels & Traders Pvt Ltd`;
    return [headerText, ...lines, "=======================", footer].join("\n");
  };

  const handleCopyAll = async () => {
    const text = buildCopyText(groups);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopyRow = async (group) => {
    const flight = group.flights?.[0];
    if (!flight) return;
    const minPrice = Math.min(
      ...Object.values(group.rooms || {}).filter(Boolean),
    );
    const price = isFinite(minPrice) ? minPrice : 0;
    const text = `${flight.flightNo} *${group.packageName}* ${flight.sectorFrom} → ${flight.sectorTo}..... *PKR ${price.toLocaleString()}*\n=======================\n*ALL GROUPS ARE NON REFUNDABLE AND NON CHANGEABLE*\n=======================\nZEB Travels & Traders Pvt Ltd`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopiedRow((prev) => ({ ...prev, [group.id]: true }));
    setTimeout(
      () => setCopiedRow((prev) => ({ ...prev, [group.id]: false })),
      2000,
    );
  };

  const dashboardUI = useContext(DashboardUIContext);
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    sectors: [],
    airlines: [],
    searchKeyword: "",
    departDate: null,
  });
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [airlines, setAirlines] = useState([]);
  const [sectors, setSectors] = useState([]);

  useEffect(() => {
    if (dashboardUI) setShowAdvancedSearch(true);
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
    fetchGroups();
  }, [searchParams]);

  const formatTime = (time) => {
    if (!time) return "";
    if (time.length === 4 && !time.includes(":"))
      return `${time.slice(0, 2)}:${time.slice(2, 4)}`;
    return time.slice(0, 5);
  };

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/umrahpackages/");
      console.log(res);
      const fetchedGroups = res.data?.data || [];
      if (fetchedGroups.length === 0) {
        toast.info("No Umrah packages available at the moment");
        setGroups([]);
        setAirlines([]);
        setSectors([]);
        return;
      }

      const formattedGroups = fetchedGroups.map((pkg) => {
        const flights = pkg.groupTicket?.flights || pkg.flights || [];
        const firstFlight = flights[0] || {};
        const lastFlight = flights[flights.length - 1] || {};

        const airlineName =
          pkg.groupTicket?.airline ||
          firstFlight.airlineName ||
          firstFlight.airline ||
          pkg.airlineName ||
          "";

        const sector = `${firstFlight.sectorFrom || ""}-${firstFlight.sectorTo || ""}`;

        const toDate = (dateStr) => {
          if (!dateStr) return null;
          const d = new Date(dateStr);
          return isNaN(d) ? null : d;
        };

        const hotels = (pkg.hotels || []).map((h) => ({
          _id: h._id,
          name: h.name || "",
          city: h.location?.city || "",
          distance: h.location?.distance || "0",
          nightCount: h?.nightCount || 0,
          rating: h.rating || 0,
          mapUrl: h.location?.mapUrl,
        }));

        const rooms = pkg.rooms || {};
        const roomValues = Object.values(rooms).filter(
          (v) => typeof v === "number" && v > 0,
        );
        const minPrice = roomValues.length > 0 ? Math.min(...roomValues) : 0;

        const availableRooms =
          pkg.availableRooms !== undefined && pkg.availableRooms !== ""
            ? pkg.availableRooms
            : (pkg.groupTicket?.totalSeats ?? "");

        return {
          id: pkg._id || pkg.id,
          _id: pkg._id || pkg.id,
          packageName: pkg.packageName || "Umrah Package",
          packageDuration: pkg.days || "",
          sector,
          groupTiktId: pkg?.groupTicket?.id,
          airlineName,
          airline: {
            airline_name: airlineName,
            logo_url: pkg.flightLogo || null,
          },
          logo: pkg.logo,
          dept_date: toDate(firstFlight.depDate),
          returnDate: toDate(lastFlight.arrDate),
          depTime: formatTime(firstFlight.depTime || ""),
          arrTime: formatTime(lastFlight.arrTime || ""),
          flightNo: firstFlight.flightNo || "",
          flights,
          hotels,
          rooms,
          nightCount: pkg.nightCount || "",
          notes: pkg.notes || "",
          availableRooms,
          price: minPrice,
          transport: pkg.transports,
          metadata: {
            packageName: pkg.packageName,
            flightNumber: firstFlight.flightNo || "",
            departureDate: toDate(firstFlight.depDate),
            arrivalDate: toDate(lastFlight.arrDate),
            packageDuration: pkg.days,
            hotels,
            flights,
          },
        };
      });

      setAirlines(
        [
          ...new Set(formattedGroups.map((g) => g.airlineName).filter(Boolean)),
        ].sort(),
      );
      setSectors(
        [
          ...new Set(formattedGroups.map((g) => g.sector).filter(Boolean)),
        ].sort(),
      );
      setGroups(formattedGroups);
    } catch (err) {
      console.error("Error fetching groups:", err);
      toast.error("Failed to load Umrah packages. Please try again.");
      setGroups([]);
      setAirlines([]);
      setSectors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterType, value) => {
    if (filterType === "sector") {
      setFilters((prev) => ({
        ...prev,
        sectors: prev.sectors.includes(value)
          ? prev.sectors.filter((s) => s !== value)
          : [...prev.sectors, value],
      }));
    } else if (filterType === "airline") {
      setFilters((prev) => ({
        ...prev,
        airlines: prev.airlines.includes(value)
          ? prev.airlines.filter((a) => a !== value)
          : [...prev.airlines, value],
      }));
    } else {
      setFilters((prev) => ({ ...prev, [filterType]: value }));
    }
  };

  const filteredGroups = groups.filter((g) => {
    const airlineName = g.airlineName || "";
    const sector = (g.sector || "").toUpperCase().trim();
    const keyword = filters.searchKeyword.toLowerCase();
    if (filters.airlines.length && !filters.airlines.includes(airlineName))
      return false;
    if (filters.sectors.length && !filters.sectors.includes(sector))
      return false;
    if (
      keyword &&
      !`${airlineName} ${sector} ${g.flightNo || ""} ${g.packageName || ""}`
        .toLowerCase()
        .includes(keyword)
    )
      return false;
    if (filters.departDate && g.dept_date) {
      const depDate = new Date(g.dept_date);
      const filterDate = new Date(filters.departDate);
      if (
        depDate.getFullYear() !== filterDate.getFullYear() ||
        depDate.getMonth() !== filterDate.getMonth() ||
        depDate.getDate() !== filterDate.getDate()
      )
        return false;
    }
    return true;
  });

  const FilterContent = () => (
    <>
      <h3 className="font-bold text-sm mb-3 text-gray-800">Airlines</h3>
      <div className="space-y-0.5 max-h-52 overflow-y-auto pr-1">
        {airlines.map((airline) => (
          <label
            key={airline}
            className="flex items-center gap-2.5 cursor-pointer hover:bg-gray-50 px-2 py-2 rounded-lg transition-colors group"
          >
            <input
              type="checkbox"
              checked={filters.airlines.includes(airline)}
              onChange={() => handleFilterChange("airline", airline)}
              className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-600 group-hover:text-gray-900 font-medium">
              {airline}
            </span>
          </label>
        ))}
      </div>
      <div className="h-px bg-gray-100 my-4" />
      <h3 className="font-bold text-sm mb-3 text-gray-800">Sectors</h3>
      <div className="space-y-0.5 max-h-52 overflow-y-auto pr-1">
        {sectors.map((sector) => (
          <label
            key={sector}
            className="flex items-center gap-2.5 cursor-pointer hover:bg-gray-50 px-2 py-2 rounded-lg transition-colors group"
          >
            <input
              type="checkbox"
              checked={filters.sectors.includes(sector)}
              onChange={() => handleFilterChange("sector", sector)}
              className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-600 group-hover:text-gray-900 font-medium">
              {sector}
            </span>
          </label>
        ))}
      </div>
    </>
  );

  const UmrahPackageCard = ({ group, index }) => {
    const navigate = useNavigate();
    const allFlights = group.flights || [];
    const hotels = group.hotels || [];
    const rooms = group.rooms || {};
    const primary = theme.colors.primary;

    const makkahHotel =
      hotels.find((h) => /mak|mec|makkah/i.test(h.city || "")) || null;
    const madinahHotel =
      hotels.find((h) => /mad|med|madinah|medina/i.test(h.city || "")) || null;

    const roomOrder = ["sharing", "quint", "quad", "triple", "double"];
    const roomColors = {
      sharing: { bg: "#e8f4fd", text: "#1565c0", border: "#90caf9" },
      quad: { bg: "#f3e5f5", text: "#6a1b9a", border: "#ce93d8" },
      triple: { bg: "#e8f5e9", text: "#2e7d32", border: "#a5d6a7" },
      double: { bg: "#fff8e1", text: "#e65100", border: "#ffcc80" },
      quint: { bg: "#fce4ec", text: "#880e4f", border: "#f48fb1" },
    };

    const availableRoomTypes = roomOrder
      .filter((key) => typeof rooms[key] === "number" && rooms[key] > 0)
      .map((key) => ({
        key,
        label: key.charAt(0).toUpperCase() + key.slice(1),
      }));

    const handleBooking = (roomTypeKey = null) => {
      if (!user) {
        navigate("/auth/register");
        return;
      }
      navigate("/dashboard/pkg-detail", {
        state: {
          group,
          selectedRoomType: roomTypeKey,
        },
      });
    };

    const fmt = (n) => Number(n).toLocaleString();
    const flightRowText = (fl) => {
      const depD = fl.depDate ? new Date(fl.depDate) : null;

      const dateStr = depD
        ? `${String(depD.getDate()).padStart(2, "0")} ${MONTHS_TITLE[depD.getMonth()]}`
        : "";

      const sector =
        fl.sectorFrom && fl.sectorTo ? `${fl.sectorFrom}-${fl.sectorTo}` : "";

      const times = [fl.depTime, fl.arrTime].filter(Boolean).join("–");

      const baggage = fl.baggage ? fl.baggage : "";

      const parts = [];

      if (dateStr) parts.push(dateStr);
      if (sector) parts.push(sector);
      if (fl.flightNo) parts.push(fl.flightNo);
      if (times) parts.push(times);
      if (baggage) parts.push(baggage);

      return parts.join(" • ");
    };

    const HotelInfo = ({ hotel, icon, align }) => (
      <div
        className="flex flex-col items-center justify-center gap-0.5"
        style={{
          minWidth: "clamp(80px, 15vw, 110px)",
          maxWidth: "clamp(100px, 20vw, 150px)",
        }}
      >
        <img
          className="h-8 md:h-10 lg:h-12"
          style={{ height: 60 }}
          src={icon}
          alt={hotel.name}
        />
        <div className="text-[9px] md:text-[10px] lg:text-[11px] font-bold text-gray-900 leading-tight text-center w-full overflow-hidden whitespace-nowrap text-ellipsis px-1">
          {(hotel.name || "").toUpperCase()}
        </div>
        <div className="text-[8px] md:text-[9px] lg:text-[10px] text-gray-500 text-center">
          {hotel.city}
        </div>
        {hotel.distance && hotel.distance !== "0" && (
          <div className="text-[8px] md:text-[9px] lg:text-[10px] text-red-400 text-center font-bold bg-amber-50 px-2 rounded-2xl">
            {hotel.distance} Mtr from Haram
          </div>
        )}
        {hotel.nightCount > 0 && (
          <div className="text-[8px] md:text-[9px] lg:text-[10px] text-gray-400 text-center">
            {hotel.nightCount} Nights
          </div>
        )}
      </div>
    );

    return (
      <div
        className={`rounded-xl overflow-hidden border border-gray-200 mb-3 bg-white shadow-sm ${flat ? "mx-auto" : ""}`}
        style={flat ? { width: "60%" } : {}}
      >
        {/* Header Bar */}
        <div
          className="flex flex-col sm:flex-row items-start sm:items-center p-3 sm:p-4 gap-2 sm:gap-3"
          style={{ background: primary }}
        >
          <div className="text-xs sm:text-sm font-bold text-white">
            {index !== undefined ? `${index + 1} ` : ""}
            <span style={{ color: "#f59e0b" }}>★</span> {group.packageName}
          </div>

          <div className="flex-1 flex flex-col items-start sm:items-center gap-1 w-full sm:w-auto">
            {allFlights.map((fl, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 text-white text-[10px] sm:text-xs font-medium flex-wrap"
              >
                <span className="text-xs opacity-90">✈</span>
                <span className="break-all">{flightRowText(fl)}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {group.packageDuration && (
              <div className="bg-white/20 border border-white/40 rounded-full px-2 sm:px-3 py-1 text-white text-[10px] sm:text-xs font-bold whitespace-nowrap">
                📦 {group.packageDuration} DAYS
              </div>
            )}
            {group.nightCount && (
              <div className="bg-white/20 border border-white/40 rounded-full px-2 sm:px-3 py-1 text-white text-[10px] sm:text-xs font-bold whitespace-nowrap">
                🌙 {group.nightCount} NIGHTS
              </div>
            )}
            {group.availableRooms !== "" &&
              group.availableRooms !== undefined && (
                <div className="bg-white/20 border border-white/40 rounded-full px-2 sm:px-3 py-1 text-white text-[10px] sm:text-xs font-bold whitespace-nowrap">
                  👥 Seats: {group.availableRooms}
                </div>
              )}
          </div>
        </div>

        {/* Body - rest remains the same */}
        <div className="p-3 sm:p-4">
          <div className="flex flex-col lg:flex-row items-center lg:items-stretch gap-3">
            {/* Airline Logo */}
            <div className="hidden sm:block w-20 h-20 shrink-0 bg-white rounded-md">
              <img
                style={{ height: 100 }}
                src={
                  group.airline?.logo_url ||
                  "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=100&h=100&fit=crop"
                }
                alt={group.airlineName}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.src =
                    "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=100&h=100&fit=crop";
                }}
              />
            </div>

            {/* Makkah Hotel */}
            <div className="shrink-0 flex items-center justify-center w-full sm:w-auto">
              {makkahHotel ? (
                <HotelInfo
                  hotel={makkahHotel}
                  icon="https://www.mtctutorials.com/wp-content/uploads/2022/06/Kaaba-High-Quality-PNG-Image-1.png"
                  align="center"
                />
              ) : (
                <div className="min-w-20 text-[10px] text-gray-400 italic text-center">
                  No Makkah hotel
                </div>
              )}
            </div>

            {/* Room Types */}
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div className="flex flex-wrap items-center justify-center gap-3">
                {availableRoomTypes.length > 0 ? (
                  availableRoomTypes.map(({ key, label }) => {
                    const c = roomColors[key] || {
                      bg: "#f3f4f6",
                      text: "#374151",
                      border: "#d1d5db",
                    };
                    return (
                      <button
                        key={key}
                        onClick={() => handleBooking(key)}
                        className="flex flex-col items-center gap-1 px-4 py-1.5 md:py-2 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-sm active:scale-95"
                        style={{
                          background: c.bg,
                          borderColor: c.border,
                        }}
                      >
                        <span
                          className="text-[8px] md:text-[9px] font-bold uppercase tracking-wide"
                          style={{ color: c.text }}
                        >
                          {label}
                        </span>
                        <span
                          className="text-[10px] md:text-xs font-bold whitespace-nowrap"
                          style={{ color: c.text }}
                        >
                          RS {fmt(rooms[key])}/-
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <span className="text-xs text-gray-400 italic">
                    Pricing unavailable
                  </span>
                )}
              </div>
              {group.notes && (
                <div className="w-full max-w-md mt-2 px-3 py-2 bg-yellow-50 border border-yellow-300 rounded-lg">
                  <div className="flex items-start gap-1.5 text-[11px]">
                    <span className="text-yellow-600 mt-0.5">📝</span>
                    <span className="font-bold text-yellow-800">Note:</span>
                    <span className="text-yellow-900 font-medium">
                      {group.notes}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Madinah Hotel */}
            <div className="shrink-0 flex items-center justify-center w-full sm:w-auto">
              {madinahHotel ? (
                <HotelInfo
                  hotel={madinahHotel}
                  icon="https://png.pngtree.com/png-clipart/20220616/original/pngtree-prophet-mohammad-madina-or-madinah-nabawi-mosque-masjid-milad-un-nabi-png-image_8081426.png"
                  align="left"
                />
              ) : (
                <div className="min-w-20 text-[10px] text-gray-400 italic text-center">
                  No Madinah hotel
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleBooking(null)}
                className="px-3 md:px-5 py-1.5 md:py-2 rounded-lg text-white text-[11px] md:text-xs font-bold whitespace-nowrap hover:opacity-90 transition-opacity"
                style={{ background: primary }}
              >
                Book Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const LoadingSkeleton = () => (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white rounded-xl overflow-hidden border border-gray-200 animate-pulse"
        >
          <div className="h-12 bg-gray-200" />
          <div className="p-4 flex flex-col sm:flex-row gap-4">
            {[1, 2, 3].map((j) => (
              <div key={j} className="flex-1 flex flex-col gap-2">
                <div className="h-3.5 bg-gray-100 rounded w-3/4" />
                <div className="h-2.5 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <TopBar
        title={"Umrah Packages"}
        icon={<Package className="text-white w-5 h-5 sm:w-6 sm:h-6" />}
      />
      <div
        className={`w-full min-h-screen bg-gray-50 ${flat ? "flex justify-center" : ""}`}
      >
        {headerType === "dashboard" && groups.length > 0 && (
          <div
            className={`flex flex-wrap justify-end gap-2 mb-3 ${flat ? "w-[60%] mx-auto" : ""}`}
          >
            <button
              onClick={handleDownloadPDF}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all"
              style={{ background: downloadingPDF ? "#94a3b8" : "#dc2626" }}
              disabled={downloadingPDF}
            >
              {downloadingPDF ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent" />
                  <span className="hidden xs:inline">Generating...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-3 h-3 sm:w-4 sm:h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  <span className="xs:inline">Download PDF</span>
                  <span className="xs:hidden">PDF</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Toolbar */}
        <div
          className={`flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 py-3 ${headerType === "dashboard" ? "rounded-t-2xl" : ""} ${flat ? "w-[60%] mx-auto" : ""}`}
        >
          <div className="w-full xl:w-auto">{header}</div>
          <div className="flex flex-col lg:flex-row items-center gap-3 w-full xl:w-auto">
            <div className="flex items-center justify-between w-full lg:w-auto gap-4">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={showAdvancedSearch}
                    onChange={(e) => setShowAdvancedSearch(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className="w-9 h-5 rounded-full transition-all"
                    style={{
                      background: showAdvancedSearch
                        ? theme.colors.primary
                        : "#d1d5db",
                    }}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${showAdvancedSearch ? "translate-x-4" : ""}`}
                    />
                  </div>
                </div>
                <span className="ml-2 text-xs font-medium text-gray-700 whitespace-nowrap">
                  Advanced Search
                </span>
              </label>
              {showAdvancedSearch && (
                <button
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="lg:hidden p-2 rounded-lg bg-gray-100 text-gray-700"
                >
                  <Menu size={16} />
                </button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              <div className="w-full sm:w-48">
                <MaskedDatePicker
                  value={filters.departDate}
                  onChange={(date) => handleFilterChange("departDate", date)}
                  placeholderText="Departure Date"
                  minDate={new Date()}
                  size="small"
                />
              </div>
              <div className="flex-1 lg:w-52 relative">
                <input
                  type="text"
                  placeholder="Search..."
                  value={filters.searchKeyword}
                  onChange={(e) =>
                    handleFilterChange("searchKeyword", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 text-sm"
                />
                <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile filter drawer - remains same */}
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsMobileFilterOpen(false)}
            />
            <div className="absolute right-0 top-0 h-full w-80 bg-white p-6 shadow-xl overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold">Filters</h2>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Menu size={20} />
                </button>
              </div>
              <FilterContent />
            </div>
          </div>
        )}

        {/* Main layout */}
        <div
          className={`flex flex-col lg:flex-row gap-5 pt-4 pb-8 ${flat ? "w-[60%] mx-auto" : ""}`}
        >
          {showAdvancedSearch && (
            <div className="hidden lg:block w-64 shrink-0">
              <div className="bg-white rounded-xl p-5 sticky top-6 border border-gray-100 shadow-sm">
                <FilterContent />
              </div>
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <LoadingSkeleton />
            ) : filteredGroups.length === 0 ? (
              <div className="bg-white rounded-xl p-8 sm:p-12 text-center border border-gray-100">
                <div className="text-4xl sm:text-5xl mb-4">✈️</div>
                <p className="text-gray-400 text-sm sm:text-base">
                  No packages available at the moment
                </p>
                <p className="text-gray-300 text-xs sm:text-sm mt-2">
                  Please check back later or adjust your filters
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredGroups.map((group, idx) => (
                  <UmrahPackageCard
                    key={group.id || group._id || idx}
                    group={group}
                    index={idx}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add responsive styles */}
      <style jsx>{`
        @media (max-width: 640px) {
          .xs\\:inline {
            display: inline;
          }
        }
        @media (min-width: 641px) {
          .xs\\:hidden {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
