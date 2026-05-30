import React, { useEffect, useState, useContext } from "react";
import { FaRegCopy, FaCheck } from "react-icons/fa";
import { DashboardUIContext } from "../../../components/Dashboard/DashboardLayout";
import {
  Menu,
  Package,
  Download,
  Search,
  SlidersHorizontal,
  X,
  Star,
  Moon,
  Users,
  Calendar,
  Plane,
  MapPin,
  Clock,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../api/axios";
import { toast } from "react-toastify";
import MaskedDatePicker from "../../../components/MaskedDatePicker";
import { theme } from "../../../theme/theme";
import TopBar from "../../../components/TopBar/TopBar";
import { generateUmrahPackagesPDF } from "../../../utils/umrahPDFGen";

export default function PublicUmrahPackages({
  headerType,
  header,
  searchParams,
  user,
  flat = true,
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
      const userInfo = { name: user?.name || "", email: user?.email || "" };
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
    const footer = `*ALL GROUPS ARE NON REFUNDABLE AND NON CHANGEABLE*\n=======================\nAL - MAMOORAH INTERNATIONAL PVT LTD`;
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
    const text = `${flight.flightNo} *${group.packageName}* ${flight.sectorFrom} → ${flight.sectorTo}..... *PKR ${price.toLocaleString()}*\n=======================\n*ALL GROUPS ARE NON REFUNDABLE AND NON CHANGEABLE*\n=======================\nAL - MAMOORAH INTERNATIONAL PVT LTD`;
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

  // ─── Filter Sidebar Content ────────────────────────────────────────────────
  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
          <Plane size={12} /> Airlines
        </h3>
        <div className="space-y-1">
          {airlines.map((airline) => (
            <label
              key={airline}
              className="flex items-center gap-3 cursor-pointer px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors group"
            >
              <div
                className={`w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all ${filters.airlines.includes(airline) ? "bg-violet-600 border-violet-600" : "border-slate-300 group-hover:border-violet-400"}`}
              >
                {filters.airlines.includes(airline) && (
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                    <path
                      d="M1 3L3 5L7 1"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <span className="text-xs text-slate-600 font-medium">
                {airline}
              </span>
            </label>
          ))}
        </div>
      </div>
      <div className="h-px bg-linear-to-r from-transparent via-slate-200 to-transparent" />
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
          <MapPin size={12} /> Sectors
        </h3>
        <div className="space-y-1">
          {sectors.map((sector) => (
            <label
              key={sector}
              className="flex items-center gap-3 cursor-pointer px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors group"
            >
              <div
                className={`w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all ${filters.sectors.includes(sector) ? "bg-violet-600 border-violet-600" : "border-slate-300 group-hover:border-violet-400"}`}
              >
                {filters.sectors.includes(sector) && (
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                    <path
                      d="M1 3L3 5L7 1"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <span className="text-xs text-slate-600 font-medium font-mono">
                {sector}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  // ─── Package Card ──────────────────────────────────────────────────────────
  const UmrahPackageCard = ({ group, index }) => {
    const navigate = useNavigate();
    const allFlights = group.flights || [];
    const hotels = group.hotels || [];
    const rooms = group.rooms || {};

    const makkahHotel =
      hotels.find((h) => /mak|mec|makkah/i.test(h.city || "")) || null;
    const madinahHotel =
      hotels.find((h) => /mad|med|madinah|medina/i.test(h.city || "")) || null;

    const roomConfig = {
      sharing: {
        label: "Sharing",
        gradient: "from-sky-500 to-blue-600",
        light: "bg-sky-50 border-sky-200 text-sky-700",
        badge: "bg-sky-100 text-sky-600",
      },
      quint: {
        label: "Quint",
        gradient: "from-pink-500 to-rose-600",
        light: "bg-pink-50 border-pink-200 text-pink-700",
        badge: "bg-pink-100 text-pink-600",
      },
      quad: {
        label: "Quad",
        gradient: "from-violet-500 to-purple-600",
        light: "bg-violet-50 border-violet-200 text-violet-700",
        badge: "bg-violet-100 text-violet-600",
      },
      triple: {
        label: "Triple",
        gradient: "from-emerald-500 to-green-600",
        light: "bg-emerald-50 border-emerald-200 text-emerald-700",
        badge: "bg-emerald-100 text-emerald-600",
      },
      double: {
        label: "Double",
        gradient: "from-amber-500 to-orange-600",
        light: "bg-amber-50 border-amber-200 text-amber-700",
        badge: "bg-amber-100 text-amber-600",
      },
    };
    const roomOrder = ["sharing", "quint", "quad", "triple", "double"];
    const availableRoomTypes = roomOrder.filter(
      (key) => typeof rooms[key] === "number" && rooms[key] > 0,
    );

    const handleBooking = (roomTypeKey = null) => {
      if (!user) {
        navigate("/auth/register");
        return;
      }
      navigate("/dashboard/pkg-detail", {
        state: { group, selectedRoomType: roomTypeKey },
      });
    };

    const fmt = (n) => Number(n).toLocaleString();

    const formatFlightRow = (fl) => {
      const depD = fl.depDate ? new Date(fl.depDate) : null;
      const dateStr = depD
        ? `${String(depD.getDate()).padStart(2, "0")} ${MONTHS_TITLE[depD.getMonth()]}`
        : "";
      const parts = [];
      if (dateStr) parts.push(dateStr);
      if (fl.sectorFrom && fl.sectorTo)
        parts.push(`${fl.sectorFrom} → ${fl.sectorTo}`);
      if (fl.flightNo) parts.push(fl.flightNo);
      const times = [fl.depTime, fl.arrTime].filter(Boolean).join(" – ");
      if (times) parts.push(times);
      if (fl.baggage) parts.push(fl.baggage);
      return parts;
    };

    const minPrice = Math.min(
      ...Object.values(rooms).filter((v) => typeof v === "number" && v > 0),
    );

    return (
      <div className="group relative bg-white rounded-2xl overflow-visible border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-violet-200 transition-all duration-300 hover:-translate-y-0.5">
        {/* ── Header Strip ── */}
        <div
          className="relative overflow-hidden rounded-t-2xl"
          style={{
            background:
              "linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #6d28d9 100%)",
          }}
        >
          {/* Decorative circles */}
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5" />
          <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/5" />
          <div className="absolute left-1/2 -bottom-6 w-24 h-24 rounded-full bg-white/3" />

          <div className="relative flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-2.5">
            {/* Package name + index */}
            <div className="flex items-center gap-3 shrink-0">
              <span className="w-7 h-7 rounded-lg bg-white/10 border border-white/20 text-white text-xs font-bold flex items-center justify-center shrink-0">
                {(index ?? 0) + 1}
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <Star size={11} className="text-amber-400 fill-amber-400" />
                  <span className="text-white font-bold text-sm tracking-wide">
                    {group.packageName}
                  </span>
                </div>
              </div>
            </div>

            {/* Flights */}
            <div className="flex-1 flex justify-between gap-1.5 sm:px-4">
              {allFlights.map((fl, i) => {
                const parts = formatFlightRow(fl);
                return (
                  <div key={i} className="flex items-center gap-1">
                    <div className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-0.5">
                      <Plane
                        size={9}
                        className="text-violet-300 shrink-0"
                        style={{ transform: "rotate(45deg)" }}
                      />
                      <span className="text-white/90 text-[10px] font-medium">
                        {parts.join(" · ")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {group.packageDuration && (
                <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1.5">
                  <Calendar size={10} className="text-violet-300" />
                  <span className="text-white text-[10px] font-bold">
                    {group.packageDuration} DAYS
                  </span>
                </div>
              )}
              {group.nightCount && (
                <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1.5">
                  <Moon size={10} className="text-violet-300" />
                  <span className="text-white text-[10px] font-bold">
                    {group.nightCount} NIGHTS
                  </span>
                </div>
              )}
              {group.availableRooms !== "" &&
                group.availableRooms !== undefined && (
                  <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1.5">
                    <Users size={10} className="text-violet-300" />
                    <span className="text-white text-[10px] font-bold">
                      Seats: {group.availableRooms}
                    </span>
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-4 py-3">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            {/* Airline Logo */}
            <div className="hidden sm:flex items-center justify-center w-24 shrink-0">
              <img
                src={
                  group.airline?.logo_url ||
                  "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=100&h=100&fit=crop"
                }
                alt={group.airlineName}
                className="w-full h-auto max-h-12 object-contain p-1"
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

            {/* Divider */}
            <div className="hidden lg:block w-px h-12 bg-slate-200 self-center" />

            {/* ── Room Prices Container ── */}
            <div className="flex-1 w-full flex flex-col items-center justify-center gap-2">
              {/* REMOVED overflow-x-auto AND flex-nowrap TO PREVENT SCROLLBARS */}
              <div className="flex flex-wrap items-center justify-center gap-2 w-full">
                {availableRoomTypes.length > 0 ? (
                  availableRoomTypes.map((key) => {
                    const cfg = roomConfig[key] || {
                      label: key,
                      gradient: "from-slate-400 to-slate-600",
                      light: "bg-slate-50 border-slate-200 text-slate-700",
                      badge: "",
                    };
                    return (
                      <button
                        key={key}
                        onClick={() => handleBooking(key)}
                        className={`group/btn relative flex flex-col items-center justify-center py-1.5 min-w-15 rounded-xl border-2 transition-all duration-200 hover:shadow-md active:scale-95 ${cfg.light}`}
                      >
                        <span className="text-[11px] font-extrabold uppercase tracking-wider opacity-70">
                          {cfg.label}
                        </span>
                        <span className="text-xs font-black tabular-nums leading-tight">
                          {fmt(rooms[key])}
                        </span>
                        <div
                          className={`absolute inset-0 rounded-xl opacity-0 group-hover/btn:opacity-10 bg-linear-to-br ${cfg.gradient} transition-opacity`}
                        />
                      </button>
                    );
                  })
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    Pricing unavailable
                  </span>
                )}
              </div>

              {/* Notes */}
              {group.notes && (
                <div className="w-full max-w-sm px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 mt-1">
                  <div>
                    <span className="text-[9px] font-bold text-amber-700 uppercase tracking-wide block">
                      Note {group.notes}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="hidden lg:block w-px h-12 bg-slate-200 self-center" />

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

            {/* ── CTA ── */}
            <div className="flex sm:flex-col items-center justify-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                onClick={() => handleBooking(null)}
                className="relative overflow-hidden group/cta px-5 py-2.5 rounded-xl text-white text-xs font-bold tracking-wide shadow-lg hover:shadow-violet-200 transition-all duration-200 active:scale-95 whitespace-nowrap w-full sm:w-auto"
                style={{
                  background: "linear-gradient(135deg, #312e81, #6d28d9)",
                }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Book Now
                  <ChevronRight
                    size={14}
                    className="group-hover/cta:translate-x-0.5 transition-transform"
                  />
                </span>
                <div className="absolute inset-0 bg-white/0 group-hover/cta:bg-white/10 transition-colors rounded-xl" />
              </button>
              <button
                onClick={() => handleCopyRow(group)}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 text-[10px] font-medium hover:bg-slate-50 hover:text-slate-700 transition-all w-full sm:w-auto"
              >
                {copiedRow[group.id] ? (
                  <FaCheck size={9} className="text-emerald-500" />
                ) : (
                  <FaRegCopy size={9} />
                )}
                {copiedRow[group.id] ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── Hotel Card Sub-component ──────────────────────────────────────────────
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

  // ─── Loading Skeleton ──────────────────────────────────────────────────────
  const LoadingSkeleton = () => (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white rounded-2xl overflow-hidden border border-slate-200 animate-pulse"
        >
          <div className="h-16 bg-linear-to-r from-slate-200 via-slate-100 to-slate-200" />
          <div className="p-5 flex gap-4">
            <div className="w-20 h-20 bg-slate-100 rounded-xl" />
            <div className="flex-1 flex flex-col gap-3 justify-center">
              <div className="h-3 bg-slate-100 rounded-full w-2/3" />
              <div className="h-3 bg-slate-100 rounded-full w-1/2" />
            </div>
            <div className="flex gap-2 items-center">
              {[1, 2, 3].map((j) => (
                <div key={j} className="w-20 h-16 bg-slate-100 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      <TopBar
        title={"Umrah Packages"}
        icon={<Package className="text-white w-5 h-5 sm:w-6 sm:h-6" />}
      />

      <div
        className={`w-full min-h-screen bg-slate-50/80 ${flat ? "flex justify-center" : ""}`}
      >
        <div
          className={`${flat ? "w-full max-w-7xl mx-auto px-4" : "px-4 sm:px-6"} pb-10`}
        >
          {/* ── Action Bar ── */}
          {headerType === "dashboard" && groups.length > 0 && (
            <div className="flex flex-wrap justify-between items-center gap-3 pt-4 pb-2">
              <div>{header}</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyAll}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-100 transition-all"
                >
                  {copiedAll ? (
                    <FaCheck size={11} className="text-emerald-500" />
                  ) : (
                    <FaRegCopy size={11} />
                  )}
                  {copiedAll ? "Copied!" : "Copy All"}
                </button>
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloadingPDF}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-semibold transition-all shadow-sm hover:shadow-md disabled:opacity-60"
                  style={{
                    background: downloadingPDF
                      ? "#94a3b8"
                      : "linear-gradient(135deg, #dc2626, #b91c1c)",
                  }}
                >
                  {downloadingPDF ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                  ) : (
                    <Download size={13} />
                  )}
                  {downloadingPDF ? "Generating..." : "Download PDF"}
                </button>
              </div>
            </div>
          )}

          {/* ── Toolbar ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={showAdvancedSearch}
                    onChange={(e) => setShowAdvancedSearch(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className="w-10 h-5 rounded-full transition-all shadow-inner"
                    style={{
                      background: showAdvancedSearch ? "#6d28d9" : "#e2e8f0",
                    }}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${showAdvancedSearch ? "translate-x-5" : ""}`}
                    />
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <SlidersHorizontal size={12} className="text-slate-400" />{" "}
                  Filters
                </span>
              </label>
              {showAdvancedSearch &&
                (filters.airlines.length > 0 || filters.sectors.length > 0) && (
                  <button
                    onClick={() =>
                      setFilters({
                        sectors: [],
                        airlines: [],
                        searchKeyword: "",
                        departDate: null,
                      })
                    }
                    className="text-[10px] text-violet-600 font-semibold hover:underline"
                  >
                    Clear all
                  </button>
                )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              <div className="w-full sm:w-44">
                <MaskedDatePicker
                  value={filters.departDate}
                  onChange={(date) => handleFilterChange("departDate", date)}
                  placeholderText="Departure Date"
                  minDate={new Date()}
                  size="small"
                />
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search packages..."
                  value={filters.searchKeyword}
                  onChange={(e) =>
                    handleFilterChange("searchKeyword", e.target.value)
                  }
                  className="w-full sm:w-56 pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 text-sm text-slate-700 placeholder:text-slate-400 transition-all shadow-sm"
                />
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
              {showAdvancedSearch && (
                <button
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-medium shadow-sm"
                >
                  <SlidersHorizontal size={14} /> Filters
                </button>
              )}
            </div>
          </div>

          {/* ── Count Badge ── */}
          {!loading && (
            <div className="mb-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 border border-violet-100 text-violet-700 text-xs font-semibold">
                <Sparkles size={10} className="text-violet-500" />
                {filteredGroups.length} Package
                {filteredGroups.length !== 1 ? "s" : ""} Available
              </span>
              {(filters.airlines.length > 0 ||
                filters.sectors.length > 0 ||
                filters.searchKeyword ||
                filters.departDate) && (
                <span className="text-xs text-slate-400">· filtered</span>
              )}
            </div>
          )}

          {/* ── Main Layout ── */}
          <div className="flex gap-5">
            {/* Sidebar */}
            {showAdvancedSearch && (
              <aside className="hidden lg:block w-40 xl:w-55 shrink-0">
                <div className="bg-white rounded-2xl p-5 sticky top-6 border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                      Refine
                    </h2>
                    {(filters.airlines.length > 0 ||
                      filters.sectors.length > 0) && (
                      <button
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            airlines: [],
                            sectors: [],
                          }))
                        }
                        className="text-[10px] text-violet-600 font-semibold hover:underline"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <FilterContent />
                </div>
              </aside>
            )}

            {/* Cards */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <LoadingSkeleton />
              ) : filteredGroups.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
                  <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
                    <Plane
                      size={28}
                      className="text-violet-300"
                      style={{ transform: "rotate(45deg)" }}
                    />
                  </div>
                  <p className="text-slate-600 font-semibold text-base mb-1">
                    No packages found
                  </p>
                  <p className="text-slate-400 text-sm">
                    Try adjusting your filters or check back later
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
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
      </div>

      {/* Mobile Filter Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-violet-600" />{" "}
                Filters
              </h2>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={16} className="text-slate-500" />
              </button>
            </div>
            <div className="p-5">
              <FilterContent />
            </div>
            <div className="p-5 border-t border-slate-100">
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full py-2.5 rounded-xl text-white text-sm font-bold"
                style={{
                  background: "linear-gradient(135deg, #312e81, #6d28d9)",
                }}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
