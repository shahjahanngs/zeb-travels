import PageMeta from "../../components/common/PageMeta";
import {
  ArrowRightIcon,
  UsersIcon,
  IdentificationIcon,
  PlusIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  RectangleStackIcon,
  BanknotesIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  Square3Stack3DIcon
} from "@heroicons/react/24/outline";
import { Link, useNavigate } from "react-router";
import AgentStatusChart from "../../components/charts/AgentStatusChart";
import { useEffect, useState } from "react";
import axiosInstance from "../../Api/axios";
import { Modal } from "../../components/ui/modal";
import CopySectorModal from "../../components/common/CopySectorModal";
import { UnifiedGroup, buildCopyText, copyToClipboard } from "../../utils/copyFlightData";

type MenuColor =
  | "rose"
  | "blue"
  | "sky"
  | "emerald"
  | "violet"
  | "amber"
  | "teal"
  | "indigo"
  | "orange"
  | "cyan"
  | "pink"
  | "slate";

interface QuickAccessItem {
  label: string;
  to: string;
  color: MenuColor;
  icon: React.ReactNode;
}

const colorClasses: Record<MenuColor, string> = {
  rose: "bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white",
  blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
  sky: "bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white",
  emerald: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white",
  violet: "bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white",
  amber: "bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white",
  teal: "bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white",
  indigo: "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white",
  orange: "bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white",
  cyan: "bg-cyan-50 text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white",
  pink: "bg-pink-50 text-pink-600 group-hover:bg-pink-600 group-hover:text-white",
  slate: "bg-slate-100 text-slate-600 group-hover:bg-slate-700 group-hover:text-white",
};

const quickAccessItems: QuickAccessItem[] = [
  { label: "Create Umrah Package", to: "/create-package", color: "rose", icon: <IdentificationIcon className="h-6 w-6" /> },
  { label: "Create Sector Group", to: "/sector", color: "blue", icon: <PlusIcon className="h-6 w-6" /> },
  { label: "Add Airline", to: "/airline", color: "sky", icon: <GlobeAltIcon className="h-6 w-6" /> },
  { label: "Add Group Ticketing", to: "/group-ticketing/create", color: "emerald", icon: <RectangleStackIcon className="h-6 w-6" /> },
  { label: "All Bookings", to: "/all-bookings", color: "violet", icon: <DocumentTextIcon className="h-6 w-6" /> },
  { label: "Manage Sectors", to: "/manage-sectors", color: "amber", icon: <Cog6ToothIcon className="h-6 w-6" /> },
  { label: "Agencies List", to: "/registered-agencies", color: "teal", icon: <UsersIcon className="h-6 w-6" /> },
  { label: "Add Bank Details", to: "/add-bank", color: "indigo", icon: <BanknotesIcon className="h-6 w-6" /> },
  { label: "View Group Ticketing", to: "/group-ticketing", color: "orange", icon: <ShieldCheckIcon className="h-6 w-6" /> },
  { label: "View Accounts", to: "/view-accounts", color: "cyan", icon: <BanknotesIcon className="h-6 w-6" /> },
  { label: "API Groups", to: "/api-groups", color: "pink", icon: <Square3Stack3DIcon className="h-6 w-6" /> },
  { label: "Local Groups", to: "/group-ticketing", color: "slate", icon: <RectangleStackIcon className="h-6 w-6" /> },
];

export default function Home() {
  const navigate = useNavigate();
  const [unifiedGroups, setUnifiedGroups] = useState<UnifiedGroup[]>([]);
  const [copied, setCopied] = useState(false);
  const [isMarginModalOpen, setIsMarginModalOpen] = useState(false);
  const [marginValue, setMarginValue] = useState("");
  const [marginType, setMarginType] = useState<"percent" | "amount">("percent");
  const [isApplyingMargin, setIsApplyingMargin] = useState(false);
  const [currentMargin, setCurrentMargin] = useState<{ value: number; type: "percent" | "amount" } | null>(null);
  const [showSectorModal, setShowSectorModal] = useState(false);

  const fetchUnifiedGroups = async (): Promise<void> => {
    try {
      const response = await axiosInstance.get("/sector/getUnifiedGroups");
      if (response.data.success && Array.isArray(response.data.data)) {
        setUnifiedGroups(response.data.data);
      } else {
        console.warn("Data format matches but array not found or success is false");
      }
    } catch (error: unknown) {
      console.error("Error fetching unified groups:", error);
    }
  };

  const fetchMargin = async (): Promise<void> => {
    try {
      const response = await axiosInstance.get("/sector/getMargin");
      if (response.data.success) {
        setCurrentMargin({
          value: response.data.data.value,
          type: response.data.data.type,
        });
      }
    } catch (error: unknown) {
      console.error("Error fetching margin:", error);
    }
  };

  const handleCopyData = async (): Promise<void> => {
    const text = buildCopyText(unifiedGroups);
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleApplyMargin = async (): Promise<void> => {
    if (!marginValue || marginValue === "0") {
      alert("Please enter a valid margin value");
      return;
    }

    setIsApplyingMargin(true);
    try {
      const payload = {
        value: parseFloat(marginValue),
        type: marginType,
      };

      const response = await axiosInstance.post("/sector/applyMargin", payload);

      if (response.data.success) {
        alert(`Margin saved: ${marginValue} ${marginType === "percent" ? "%" : "Rs"}`);
        setIsMarginModalOpen(false);
        setMarginValue("");
        setMarginType("percent");
        fetchMargin();
      } else {
        alert(response.data.message || "Failed to save margin");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error saving margin";
      alert(errorMessage);
      console.error("Error saving margin:", error);
    } finally {
      setIsApplyingMargin(false);
    }
  };

  useEffect(() => {
    fetchUnifiedGroups();
    fetchMargin();
  }, []);

  return (
    <>
      <PageMeta
        title="Dashboard | ZEB Travels & Traders Pvt Ltd"
        description="Dashboard overview for ZEB Travels & Traders Pvt Ltd"
      />

      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-black dark:text-white">Dashboard</h1>
          <div className="text-sm text-gray-500">
            <span className="text-blue-600">Home</span> / Profile
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end mb-6 gap-3 flex-wrap">
        <button
          onClick={handleCopyData}
          disabled={unifiedGroups.length === 0}
          title={unifiedGroups.length === 0 ? "No data available to copy" : "Copy flight data"}
          style={{
            backgroundColor: unifiedGroups.length === 0 ? '#d1d5db' : copied ? '#22c55e' : '#3b82f6',
            color: 'white',
            opacity: unifiedGroups.length === 0 ? 0.6 : 1
          }}
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-all cursor-pointer"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy All Data ({unifiedGroups.length})
            </>
          )}
        </button>

        <button
          onClick={() => setShowSectorModal(true)}
          disabled={unifiedGroups.length === 0}
          title={unifiedGroups.length === 0 ? "No data available" : "Copy specific sector data"}
          style={{
            backgroundColor: unifiedGroups.length === 0 ? '#d1d5db' : '#8b5cf6',
            color: 'white',
            opacity: unifiedGroups.length === 0 ? 0.6 : 1
          }}
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          Copy Specific Data
        </button>

        <button
          onClick={() => setIsMarginModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-all cursor-pointer bg-purple-600 hover:bg-purple-700 text-white"
          title="Apply margin to all groups"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Apply Margin
        </button>
      </div>

      {/* Quick Access Menu Grid Section */}
      <div className="mb-8">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
              Quick Access Menu
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Manage important travel modules quickly
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {quickAccessItems.map((item) => (
            <Link
              key={`${item.label}-${item.to}`}
              to={item.to}
              className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-slate-50 transition-all duration-500 group-hover:scale-[2.2]" />

              <div className="relative z-10 flex flex-col items-center text-center">
                <div
                  className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110 ${colorClasses[item.color]}`}
                >
                  {item.icon}
                </div>

                <span className="text-xs font-extrabold leading-tight text-slate-800 transition group-hover:text-slate-950">
                  {item.label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Top Cards Section (Agents & Index Cards) */}
      <div className="grid grid-cols-1 gap-5 mb-6 md:grid-cols-2">
        {/* Agents */}
        <div className="group relative overflow-hidden rounded-[1.7rem] border border-slate-100 bg-white p-6 shadow-sm transition-all duration-500 hover:shadow-lg">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-100 transition-all duration-500 group-hover:scale-150" />

          <div className="relative z-10">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <UsersIcon className="w-7 h-7" />
              </div>

              <ArrowRightIcon className="w-5 h-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-600" />
            </div>

            <h3 className="text-2xl font-extrabold text-slate-900">
              Agents
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Manage registered agencies, monitor activity and access all agent records.
            </p>

            <Link
              to="/registered-agencies"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-5 py-2.5 text-sm font-bold text-emerald-600 transition hover:bg-emerald-100"
            >
              View Agents
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Index Cards */}
        <div className="group relative overflow-hidden rounded-[1.7rem] border border-slate-100 bg-white p-6 shadow-sm transition-all duration-500 hover:shadow-lg">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-100 transition-all duration-500 group-hover:scale-150" />

          <div className="relative z-10">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                <IdentificationIcon className="w-7 h-7" />
              </div>

              <ArrowRightIcon className="w-5 h-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" />
            </div>

            <h3 className="text-2xl font-extrabold text-slate-900">
              Index Cards
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Access special offers, promotional content and index card management.
            </p>

            <button
              onClick={() => navigate("/special-offers")}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-5 py-2.5 text-sm font-bold text-blue-600 transition hover:bg-blue-100"
            >
              View Cards
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Agent Status Chart */}
      <div className="mb-6">
        <AgentStatusChart />
      </div>

      {/* View Sections */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        <Link to="all-groups" className="flex justify-center items-center gap-2.5 bg-linear-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-semibold py-4 px-6 rounded-2xl transition-all shadow-lg text-lg">
          View All Groups <ArrowRightIcon className="w-4 h-4" />
        </Link>
      </div>

      {/* Apply Margin Modal */}
      <Modal
        isOpen={isMarginModalOpen}
        onClose={() => {
          setIsMarginModalOpen(false);
          setMarginValue("");
          setMarginType("percent");
        }}
        className="max-w-md"
      >
        <div className="p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-black dark:text-white mb-6">Apply Margin</h2>

          {currentMargin && currentMargin.value > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-6">
              <p className="text-xs sm:text-sm text-green-700 dark:text-green-300">
                <strong>Current Margin:</strong> {currentMargin.value} {currentMargin.type === "percent" ? "%" : "Rs"}
              </p>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Margin Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="marginType"
                    value="percent"
                    checked={marginType === "percent"}
                    onChange={(e) => setMarginType(e.target.value as "percent" | "amount")}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Percentage (%)</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="marginType"
                    value="amount"
                    checked={marginType === "amount"}
                    onChange={(e) => setMarginType(e.target.value as "percent" | "amount")}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Fixed Amount (Rs)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Margin Value
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={marginValue}
                  onChange={(e) => setMarginValue(e.target.value)}
                  placeholder={marginType === "percent" ? "Enter percentage (e.g., 5)" : "Enter amount (e.g., 500)"}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600 dark:text-gray-400 font-medium">
                  {marginType === "percent" ? "%" : "Rs"}
                </span>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                This margin will be applied at the frontend when displaying prices.
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button
              onClick={() => {
                setIsMarginModalOpen(false);
                setMarginValue("");
                setMarginType("percent");
              }}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              disabled={isApplyingMargin}
            >
              Cancel
            </button>
            <button
              onClick={handleApplyMargin}
              disabled={isApplyingMargin || !marginValue}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
            >
              {isApplyingMargin ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Sector Data Copy Modal */}
      <CopySectorModal
        isOpen={showSectorModal}
        onClose={() => setShowSectorModal(false)}
        groups={unifiedGroups}
      />
    </>
  );
}