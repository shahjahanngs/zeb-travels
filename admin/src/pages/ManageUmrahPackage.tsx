import { useEffect, useRef, useState } from "react";
import {
  Table,
  TableCell,
  TableHeader,
  TableRow,
  TableBody,
} from "../components/ui/table";

import ComponentCard from "../components/common/ComponentCard";
import axiosInstance from "../Api/axios";

import { PencilIcon, TrashBinIcon } from "../icons";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useNavigate } from "react-router";

import { generateUmrahPackagesPDF } from "../utils/Umrahpkgspgs";

interface PackageData {
  _id: string;

  packageName: string;

  availableRooms?: number;

  days?: number;

  nightCount?: string;

  hotels: {
    name: string;
    rating?: number;

    location?: {
      city?: string;
      distance?: string;
    };
  }[];

  transports?: {
    route?: string;
    transportType?: string;
  }[];

  rooms?: {
    sharing?: number;
    quint?: number;
    quad?: number;
    triple?: number;
    double?: number;
    childWithoutPackage?: number;
    InfantWithoutPackage?: number;
  };

  groupTicket?: {
    flights?: {
      airline?: string;
      flightNo?: string;
      depDate: string;
      depTime?: string;
      arrDate?: string;
      arrTime?: string;
      sectorFrom: string;
      sectorTo: string;
      baggage?: string;
      meal?: string;
      flightClass?: string;
    }[];
  };
}

const ManageUmrahPackage = () => {
  const [packages, setPackages] = useState<PackageData[]>([]);

  const [loading, setLoading] = useState(true);

  const [downloadingPDF, setDownloadingPDF] =
    useState(false);

  const [selectedPackage, setSelectedPackage] =
    useState<PackageData | null>(null);

  const navigate = useNavigate();

  const hasFetched = useRef(false);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr; // fallback if invalid

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "-";

    // If time is already in HH:mm format, return as is
    if (timeStr.length <= 8) return timeStr;

    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return timeStr;

    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleDownloadPDF = async () => {
    if (packages.length === 0) {
      toast.warning("No packages available to download");
      return;
    }

    setDownloadingPDF(true);

    try {
      await generateUmrahPackagesPDF(packages);

      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF download failed:", error);

      toast.error(
        "Failed to generate PDF. Please try again.",
      );
    } finally {
      setDownloadingPDF(false);
    }
  };

  useEffect(() => {
    const fetchPackages = async () => {
      if (hasFetched.current) return;

      hasFetched.current = true;

      try {
        const { data } = await axiosInstance.get(
          "/umrahpackages/",
        );

        if (data?.success) {
          setPackages(data.data);

          if (data.data.length === 0) {
            toast.info("No packages created yet");
          }
        }
      } catch (error) {
        console.error("Error fetching packages:", error);

        toast.error("Failed to fetch packages");
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this package?",
      )
    )
      return;

    try {
      await axiosInstance.delete(`/umrahpackages/${id}`);

      setPackages((prev) =>
        prev.filter((pkg) => pkg._id !== id),
      );

      toast.success("Package deleted successfully");
    } catch (error) {
      console.error("Error deleting package:", error);

      toast.error("Failed to delete package");
    }
  };

  const roomLabels: Record<string, string> = {
    sharing: "Sharing",
    quint: "Quint",
    quad: "Quad",
    triple: "Triple",
    double: "Double",
    childWithoutPackage: "Child",
    InfantWithoutPackage: "Infant",
  };

  return (
    <>
      <ComponentCard title="Manage Umrah Packages">
        {/* PDF BUTTON */}

        <button
          onClick={handleDownloadPDF}
          disabled={downloadingPDF}
          style={{
            background: downloadingPDF
              ? "#94a3b8"
              : "#dc2626",

            color: "white",

            borderRadius: 8,

            fontWeight: 600,

            fontSize: 13,

            padding: "7px 18px",

            display: "flex",

            alignItems: "center",

            gap: 8,

            cursor: downloadingPDF
              ? "not-allowed"
              : "pointer",

            border: "none",
          }}
        >
          {downloadingPDF ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />

              Generating...
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
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

              Download PDF
            </>
          )}
        </button>

        {/* TABLE */}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3 mt-4">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/5">
                <TableRow>
                  {[
                    "Sr. No",
                    "Package Name",
                    "Available Packages",
                    "No Of Days",
                    "Hotel Name",
                    "Action",
                  ].map((header, idx) => (
                    <TableCell
                      key={idx}
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell className="text-center py-4">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : packages.length === 0 ? (
                  <TableRow>
                    <TableCell className="text-center py-4">
                      No packages found
                    </TableCell>
                  </TableRow>
                ) : (
                  packages.map((pkg, index) => (
                    <TableRow key={pkg._id}>
                      <TableCell className="px-5 py-4 text-start text-gray-900 dark:text-gray-100">
                        {index + 1}
                      </TableCell>

                      <TableCell className="px-4 py-3 text-start">
                        {pkg.packageName || "-"}
                      </TableCell>

                      <TableCell className="px-4 py-3 text-start">
                        {pkg.availableRooms ?? "-"}
                      </TableCell>

                      <TableCell className="px-4 py-3 text-start">
                        {pkg.days ?? "-"}
                      </TableCell>

                      <TableCell className="px-4 py-3 text-start">
                        {pkg.hotels
                          .map((h) => h.name)
                          .join(", ") || "-"}
                      </TableCell>

                      <TableCell className="px-4 py-3 text-start">
                        <div className="flex items-center gap-3 flex-wrap">
                          {/* VIEW */}

                          <button
                            onClick={() =>
                              setSelectedPackage(pkg)
                            }
                            className="rounded bg-emerald-500 px-3 py-1 text-white text-sm hover:bg-emerald-600 transition"
                          >
                            View
                          </button>

                          {/* EDIT */}

                          <button
                            onClick={() => {
                              navigate(
                                `/update-umrah-package/${pkg._id}`,
                              );
                            }}
                            className="flex items-center gap-1 rounded bg-blue-500 px-3 py-1 text-white text-sm hover:bg-blue-600 transition"
                          >
                            <PencilIcon />
                            Edit
                          </button>

                          {/* DELETE */}

                          <button
                            onClick={() =>
                              handleDelete(pkg._id)
                            }
                            className="flex items-center gap-1 rounded bg-red-500 px-3 py-1 text-white text-sm hover:bg-red-600 transition"
                          >
                            <TrashBinIcon />
                            Delete
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <ToastContainer style={{ zIndex: 9999999 }} />
      </ComponentCard>

      {/* ================= MODAL ================= */}

      {selectedPackage && (
        <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-6xl rounded-2xl bg-white shadow-2xl max-h-[95vh] overflow-y-auto">
            {/* HEADER */}

            <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-white px-6 py-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedPackage.packageName}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {selectedPackage.days} Days •{" "}
                  {selectedPackage.nightCount}
                </p>
              </div>

              <button
                onClick={() =>
                  setSelectedPackage(null)
                }
                className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
              >
                Close
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* FLIGHTS */}

              {/* FLIGHTS */}
              <div className="rounded-2xl border border-gray-200">
                <div className="border-b bg-slate-50 px-5 py-3">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Flight Details
                  </h3>
                </div>

                <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {selectedPackage.groupTicket?.flights?.map((flight, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-gray-200 p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-gray-800">
                          {flight.airline} • {flight.flightNo}
                        </h4>

                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                          {flight.flightClass}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="font-semibold">Route:</span>{" "}
                          {flight.sectorFrom} → {flight.sectorTo}
                        </p>

                        <p>
                          <span className="font-semibold">Departure:</span>{" "}
                          {formatDate(flight.depDate)} • {formatTime(flight.depTime)}
                        </p>

                        <p>
                          <span className="font-semibold">Arrival:</span>{" "}
                          {formatDate(flight.arrDate)} • {formatTime(flight.arrTime)}
                        </p>

                        <p>
                          <span className="font-semibold">Baggage:</span>{" "}
                          {flight.baggage || "-"}
                        </p>

                        <p>
                          <span className="font-semibold">Meal:</span>{" "}
                          {flight.meal || "-"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* HOTELS */}

              <div className="rounded-2xl border border-gray-200">
                <div className="border-b bg-slate-50 px-5 py-3">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Hotel Details
                  </h3>
                </div>

                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                  {selectedPackage.hotels?.map(
                    (hotel, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-gray-200 p-4 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-gray-800">
                            {hotel.name}
                          </h4>

                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                            ⭐ {hotel.rating || 0}
                          </span>
                        </div>

                        <div className="mt-3 space-y-2 text-sm">
                          <p>
                            <span className="font-semibold">
                              City:
                            </span>{" "}
                            {hotel.location?.city}
                          </p>

                          <p>
                            <span className="font-semibold">
                              Distance:
                            </span>{" "}
                            {
                              hotel.location?.distance
                            }{" "}
                            m
                          </p>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>

              {/* TRANSPORT */}

              <div className="rounded-2xl border border-gray-200">
                <div className="border-b bg-slate-50 px-5 py-3">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Transport Details
                  </h3>
                </div>

                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                  {selectedPackage.transports?.map(
                    (transport, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-gray-200 p-4 shadow-sm"
                      >
                        <p className="font-semibold text-gray-800">
                          {
                            transport.transportType
                          }
                        </p>

                        <p className="text-sm text-gray-600 mt-2">
                          {transport.route}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </div>

              {/* ROOM PRICES */}

              <div className="rounded-2xl border border-gray-200">
                <div className="border-b bg-slate-50 px-5 py-3">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Room Pricing
                  </h3>
                </div>

                <div className="p-5 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  {Object.entries(
                    selectedPackage.rooms || {},
                  ).map(([key, value]) => (
                    <div
                      key={key}
                      className="rounded-xl border border-gray-200 bg-slate-50 p-4 text-center"
                    >
                      <p className="text-xs font-semibold uppercase text-gray-500">
                        {roomLabels[key] || key}
                      </p>

                      <p className="mt-2 text-lg font-bold text-gray-800">
                        PKR{" "}
                        {Number(
                          value || 0,
                        ).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ManageUmrahPackage;