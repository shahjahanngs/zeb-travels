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
        title="Dashboard | AlmamorahTravel"
        description="Dashboard overview for AlmamorahTravel"
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

      {/* 🚀 NEW: Quick Access Menu Grid Section */}
      <div className="mb-8">
        <h2 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
          Quick Access Menu
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {[
            { label: "Umrah Packages", to: "/create-package", color: "bg-rose-500 hover:bg-rose-600", icon: <IdentificationIcon className="w-6 h-6" /> },
            { label: "Create Sector Group", to: "/sector", color: "bg-blue-500 hover:bg-blue-600", icon: <PlusIcon className="w-6 h-6" /> },
            { label: "Add Airline", to: "/airline", color: "bg-sky-500 hover:bg-sky-600", icon: <GlobeAltIcon className="w-6 h-6" /> },
            { label: "Add Ticket Group", to: "/group-ticketing/create", color: "bg-emerald-500 hover:bg-emerald-600", icon: <RectangleStackIcon className="w-6 h-6" /> },
            { label: "All Bookings", to: "/all-bookings", color: "bg-violet-500 hover:bg-violet-600", icon: <DocumentTextIcon className="w-6 h-6" /> },
            { label: "Manage Sectors", to: "/manage-sectors", color: "bg-amber-500 hover:bg-amber-600", icon: <Cog6ToothIcon className="w-6 h-6" /> },
            { label: "Agencies List", to: "/registered-agencies", color: "bg-teal-500 hover:bg-teal-600", icon: <UsersIcon className="w-6 h-6" /> },
            { label: "Add Bank Details", to: "/add-bank", color: "bg-indigo-500 hover:bg-indigo-600", icon: <BanknotesIcon className="w-6 h-6" /> },
            { label: "Group Ticketing", to: "/group-ticketing", color: "bg-orange-500 hover:bg-orange-600", icon: <ShieldCheckIcon className="w-6 h-6" /> },
            { label: "View Accounts", to: "/view-accounts", color: "bg-cyan-600 hover:bg-cyan-700", icon: <BanknotesIcon className="w-6 h-6" /> },
            { label: "API Groups", to: "/api-groups", color: "bg-pink-500 hover:bg-pink-600", icon: <Square3Stack3DIcon className="w-6 h-6" /> },
            { label: "Local Groups", to: "/group-ticketing", color: "bg-slate-600 hover:bg-slate-700", icon: <RectangleStackIcon className="w-6 h-6" /> },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl ${item.color} p-4 text-white shadow-sm hover:scale-[1.03] transition-all duration-200 text-center`}
            >
              <div className="p-1.5 bg-white/10 rounded-lg">
                {item.icon}
              </div>
              <span className="text-xs font-semibold leading-tight tracking-wide">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Top Cards Section (Agents & Index Cards) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-6">
        {/* Agents Card */}
        <div className="bg-linear-to-br from-teal-500 to-emerald-600 dark:from-teal-600 dark:to-emerald-700 rounded-lg p-6 text-white relative shadow-lg">
          <div className="absolute top-6 right-6 opacity-20">
            <UsersIcon className="w-16 h-16" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Agents</h3>
          <p className="text-teal-100 mb-4 text-sm">My Agents</p>
          <Link to="/registered-agencies" className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded text-sm transition-colors">
            Go to list <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Index Cards */}
        <div className="bg-linear-to-br from-slate-500 to-blue-600 dark:from-slate-600 dark:to-blue-700 rounded-lg p-6 text-white relative shadow-lg">
          <div className="absolute top-6 right-6 opacity-20">
            <IdentificationIcon className="w-16 h-16" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Index Cards</h3>
          <p className="text-slate-100 mb-4 text-sm">Index Cards</p>
          <button onClick={() => { navigate("/special-offers") }} className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded text-sm transition-colors">
            Go to list <ArrowRightIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Agent Status Chart */}
      <div className="mb-6">
        <AgentStatusChart />
      </div>

      {/* View Sections */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        <Link to="all-groups" className="flex justify-center items-center bg-linear-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-semibold py-4 px-6 rounded-lg transition-all shadow-lg text-lg">
          View All Groups
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