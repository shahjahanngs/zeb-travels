import { Link } from "react-router-dom";
import {
  FaUniversity,
  FaMoneyBillWave,
  FaUsers,
  FaBook,
  FaUserCircle,
  FaArrowRight,
  FaIdCardAlt,
  FaPlane,
  FaMosque,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
} from "react-icons/fa";
import { FaClock } from "react-icons/fa";
import { theme } from "../../../theme/theme";
import TopBar from "../../../components/TopBar/TopBar";
import axiosInstance from "../../../api/axios";
import { useEffect, useState } from "react";

const Dashboard = () => {
  const [dashboardStats, setDashboardStats] = useState({
    groupBookings: {
      total: 0,
      confirmed: 0,
      cancelled: 0,
      pending: 0,
      onHold: 0,
    },
    umrahBookings: {
      total: 0,
      confirmed: 0,
      cancelled: 0,
      pending: 0,
      onHold: 0,
    },
    specialOffers: [],
  });

  const [loading, setLoading] = useState(true);

  const fetchGroupBooking = async () => {
    try {
      const res = await axiosInstance.get("/bookings");
      return res.data;
    } catch (error) {
      console.log("Error fetching group bookings", error.message);
      return { success: false, data: [] };
    }
  };

  const fetchUmrahBooking = async () => {
    try {
      const res = await axiosInstance.get("/umrah-bookings/my-bookings");
      return res.data;
    } catch (error) {
      console.log("Error fetching Umrah bookings", error.message);
      return { success: false, data: [] };
    }
  };

  const fetchSpecialOffers = async () => {
    try {
      const res = await axiosInstance.get("/specialOffer/getSpecialOffers");
      return res.data;
    } catch (error) {
      console.log("Error fetching special offers", error.message);
      return { success: false, data: [] };
    }
  };

  // Calculate statistics from bookings
  const calculateStats = (groupBookingsData, umrahBookingsData) => {
    // Group Bookings Stats
    const groupData = groupBookingsData?.data || [];
    const groupConfirmed = groupData.filter(
      (b) => b.status === "confirmed",
    ).length;
    const groupCancelled = groupData.filter(
      (b) => b.status === "cancelled",
    ).length;
    const groupOnHold = groupData.filter((b) => b.status === "on hold").length;
    const groupPending = groupData.filter((b) => b.status === "pending").length;

    // Umrah Bookings Stats
    const umrahData = umrahBookingsData?.data || [];
    const umrahConfirmed = umrahData.filter(
      (b) => b.bookingStatus === "confirmed",
    ).length;
    const umrahCancelled = umrahData.filter(
      (b) => b.bookingStatus === "cancelled",
    ).length;
    const umrahOnHold = umrahData.filter(
      (b) => b.bookingStatus === "on hold",
    ).length;
    const umrahPending = umrahData.filter(
      (b) => b.bookingStatus === "pending",
    ).length;

    return {
      groupBookings: {
        total: groupData.length,
        confirmed: groupConfirmed,
        cancelled: groupCancelled,
        pending: groupPending,
        onHold: groupOnHold,
      },
      umrahBookings: {
        total: umrahData.length,
        confirmed: umrahConfirmed,
        cancelled: umrahCancelled,
        pending: umrahPending,
        onHold: umrahOnHold,
      },
      specialOffers:
        groupBookingsData?.specialOffers ||
        umrahBookingsData?.specialOffers ||
        [],
    };
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [bRes, Sres, Ures] = await Promise.all([
        fetchGroupBooking(),
        fetchSpecialOffers(),
        fetchUmrahBooking(),
      ]);

      console.log("Group Bookings:", bRes);
      console.log("Special Offers:", Sres);
      console.log("Umrah Bookings:", Ures);

      const stats = calculateStats(bRes, Ures);
      setDashboardStats({
        ...stats,
        specialOffers: Sres?.data || [],
      });
    } catch (error) {
      console.log("Error inside Promise.all sequence:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cards = [
    {
      title: "Umrah Packages",
      description: "see the premium umrah packages",
      icon: <FaIdCardAlt />,
      link: "/dashboard/umrah-packages",
      style: theme.cards.profile,
      colors: {
        corner1: "bg-pink-100",
        corner2: "bg-pink-50",
        shadow: "hover:shadow-pink-100",
        hover: "group-hover:text-pink-700",
        cta: "text-pink-600",
      },
    },
    {
      title: "All Groups",
      description: "View and manage all group bookings",
      icon: <FaUsers />,
      link: "/dashboard/all-groups",
      style: theme.cards.groups,
      colors: {
        corner1: "bg-blue-100",
        corner2: "bg-blue-50",
        shadow: "hover:shadow-blue-100",
        hover: "group-hover:text-blue-700",
        cta: "text-blue-600",
      },
    },
    {
      title: "Bank Details",
      description: "View bank account information",
      icon: <FaUniversity />,
      link: "/dashboard/banks",
      style: theme.cards.bank,
      colors: {
        corner1: "bg-green-100",
        corner2: "bg-green-50",
        shadow: "hover:shadow-green-100",
        hover: "group-hover:text-green-700",
        cta: "text-green-600",
      },
    },
    {
      title: "Payment",
      description: "Make payments and view history",
      icon: <FaMoneyBillWave />,
      link: "/dashboard/payment",
      style: theme.cards.payment,
      colors: {
        corner1: "bg-purple-100",
        corner2: "bg-purple-50",
        shadow: "hover:shadow-purple-100",
        hover: "group-hover:text-purple-700",
        cta: "text-purple-600",
      },
    },
    {
      title: "Ledger",
      description: "View account transactions",
      icon: <FaBook />,
      link: "/dashboard/ledger",
      style: theme.cards.ledger,
      colors: {
        corner1: "bg-orange-100",
        corner2: "bg-orange-50",
        shadow: "hover:shadow-orange-100",
        hover: "group-hover:text-orange-700",
        cta: "text-orange-600",
      },
    },
    {
      title: "Profile",
      description: "Update your personal info",
      icon: <FaUserCircle />,
      link: "/dashboard/profile",
      style: theme.cards.profile,
      colors: {
        corner1: "bg-pink-100",
        corner2: "bg-pink-50",
        shadow: "hover:shadow-pink-100",
        hover: "group-hover:text-pink-700",
        cta: "text-pink-600",
      },
    },
  ];

  const StatCard = ({
    title,
    confirmed = 0,
    cancelled = 0,
    onHold = 0,
    pending = 0,
    total = 0,
    icon: Icon,
    color = { bg: "bg-blue-50", text: "text-blue-600" },
  }) => {
    return (
      <div className="bg-white rounded-[1.7rem] border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
        {/* Top Header Section */}
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {title}
            </span>
            <div className="text-3xl font-bold text-slate-800 tracking-tight">
              {total}
            </div>
          </div>
          <div
            className={`w-10 h-10 rounded-lg ${color.bg} flex items-center justify-center shrink-0 shadow-sm`}
          >
            <Icon className={`text-lg ${color.text}`} />
          </div>
        </div>

        {/* Modern Status Grid with Solid/Soft Backgrounds */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          {/* Confirmed - Emerald */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/60 border border-emerald-100/50">
            <div className="flex items-center gap-1.5 min-w-0">
              <FaCheckCircle className="text-emerald-500 text-xs shrink-0" />
              <span className="text-xs font-medium text-emerald-800 truncate">
                Confirmed
              </span>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md shadow-sm border border-emerald-100">
              {confirmed}
            </span>
          </div>

          {/* Pending - Blue */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50/60 border border-blue-100/50">
            <div className="flex items-center gap-1.5 min-w-0">
              <FaClock className="text-blue-500 text-xs shrink-0" />
              <span className="text-xs font-medium text-blue-800 truncate">
                Pending
              </span>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-white px-2 py-0.5 rounded-md shadow-sm border border-blue-100">
              {pending}
            </span>
          </div>

          {/* On Hold - Amber */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/60 border border-amber-100/50">
            <div className="flex items-center gap-1.5 min-w-0">
              <FaHourglassHalf className="text-amber-500 text-xs shrink-0" />
              <span className="text-xs font-medium text-amber-800 truncate">
                On Hold
              </span>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-white px-2 py-0.5 rounded-md shadow-sm border border-amber-100">
              {onHold}
            </span>
          </div>

          {/* Cancelled - Red */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-red-50/60 border border-red-100/50">
            <div className="flex items-center gap-1.5 min-w-0">
              <FaTimesCircle className="text-red-500 text-xs shrink-0" />
              <span className="text-xs font-medium text-red-800 truncate">
                Cancelled
              </span>
            </div>
            <span className="text-xs font-bold text-red-700 bg-white px-2 py-0.5 rounded-md shadow-sm border border-red-100">
              {cancelled}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Carousel Component
  const SpecialOffersCarousel = ({ offers }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
      if (offers.length <= 1) return;
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % offers.length);
      }, 4000);
      return () => clearInterval(interval);
    }, [offers.length]);

    const goToNext = () => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % offers.length);
    };

    const goToPrev = () => {
      setCurrentIndex(
        (prevIndex) => (prevIndex - 1 + offers.length) % offers.length,
      );
    };

    if (offers.length === 0) {
      return (
        <div className="bg-white rounded-xl border border-slate-100 p-6 text-center">
          <p className="text-slate-400 text-sm">No special offers available</p>
        </div>
      );
    }

    return (
      <div className="relative bg-white rounded-xl border border-slate-100 overflow-hidden group">
        <div className="relative h-48 overflow-hidden">
          {offers.map((offer, idx) => (
            <div
              key={offer._id || idx}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${idx === currentIndex
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-full"
                }`}
              style={{
                transform:
                  idx === currentIndex ? "translateX(0)" : "translateX(100%)",
              }}
            >
              <img
                src={offer.image}
                alt={offer.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent p-4">
                <h3 className="text-white font-bold text-lg">{offer.title}</h3>
              </div>
            </div>
          ))}
        </div>

        {offers.length > 1 && (
          <>
            <button
              onClick={goToPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
            >
              <svg
                className="w-4 h-4 text-slate-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
            >
              <svg
                className="w-4 h-4 text-slate-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}

        {/* Dots indicator */}
        {offers.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {offers.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex
                  ? "bg-white w-4"
                  : "bg-white/50 hover:bg-white/80"
                  }`}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="overflow-hidden flex flex-col p-0 md:p-6">
      <TopBar title={"Manage your Agent Dashboard"} />

      {/* Scrollable content area with custom scrollbar */}
      <div className="flex-1 overflow-y-auto mt-4 pr-1 custom-scrollbar">
        {/* Statistics Row - Group & Umrah Bookings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          {/* Group Bookings Stats */}
          {!loading ? (
            <StatCard
              title="Group Flight Bookings"
              confirmed={dashboardStats.groupBookings.confirmed}
              cancelled={dashboardStats.groupBookings.cancelled}
              onHold={dashboardStats.groupBookings.onHold}
              pending={dashboardStats.groupBookings.pending}
              total={dashboardStats.groupBookings.total}
              icon={FaPlane}
              color={{ bg: "bg-blue-50", text: "text-blue-600" }}
            />
          ) : (
            <div className="bg-white rounded-xl border border-slate-100 p-4 animate-pulse">
              <div className="h-20 bg-slate-100 rounded-lg"></div>
            </div>
          )}

          {/* Umrah Bookings Stats */}
          {!loading ? (
            <StatCard
              title="Umrah Package Bookings"
              confirmed={dashboardStats.umrahBookings.confirmed}
              cancelled={dashboardStats.umrahBookings.cancelled}
              onHold={dashboardStats.umrahBookings.onHold}
              pending={dashboardStats.umrahBookings.pending}
              total={dashboardStats.umrahBookings.total}
              icon={FaMosque}
              color={{ bg: "bg-emerald-50", text: "text-emerald-600" }}
            />
          ) : (
            <div className="bg-white rounded-xl border border-slate-100 p-4 animate-pulse">
              <div className="h-20 bg-slate-100 rounded-lg"></div>
            </div>
          )}
        </div>

        {/* Special Offers Carousel */}
        {/* <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-slate-800">
              ✨ Special Offers
            </h2>
            <span className="text-xs text-slate-400">Auto-sliding</span>
          </div>
          <SpecialOffersCarousel offers={dashboardStats.specialOffers} />
        </div> */}

        {/* Cards Grid */}
        <div className="grid grid-cols-1 gap-3.5 sm:gap-5 pb-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, index) => (
            <Link
              to={card.link}
              key={index}
              className="group relative overflow-hidden rounded-[1.7rem] border border-slate-100 bg-white p-6 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-lg"
            >
              {/* Soft Background Glow */}
              <div
                className={`absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl transition-all duration-500 group-hover:h-40 group-hover:w-40 ${card.colors.corner1}`}
              />

              <div
                className={`absolute -bottom-10 -left-10 h-28 w-28 rounded-full blur-2xl transition-all duration-500 group-hover:h-40 group-hover:w-40 ${card.colors.corner2}`}
              />

              <div className="relative z-10">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl shadow-sm transition duration-500 group-hover:scale-110 group-hover:rotate-3 ${card.style}`}
                  >
                    {card.icon}
                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition group-hover:bg-slate-900 group-hover:text-white">
                    <FaArrowRight className="-rotate-45 text-sm transition group-hover:rotate-0" />
                  </div>
                </div>

                <h3 className="mb-2 text-xl font-extrabold tracking-tight text-slate-900 transition group-hover:text-slate-950">
                  {card.title}
                </h3>

                <p className="min-h-10 text-sm leading-6 text-slate-500">
                  {card.description}
                </p>

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className={`text-sm font-bold ${card.colors.cta}`}>
                    Manage Now
                  </span>

                  <span className="h-2 w-2 rounded-full bg-slate-300 transition-all duration-300 ease-linear group-hover:w-8 group-hover:bg-slate-900" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
