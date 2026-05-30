import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
    getAllBookingsAdmin,
    reviewPayment,
    updateBookingStatus,
} from "../../Api/umrahBookingApi";
import {
    BuildingOffice2Icon,
    UserGroupIcon,
    CreditCardIcon,
    BuildingStorefrontIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowPathIcon,
    XMarkIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    PaperClipIcon,
    HashtagIcon,
    IdentificationIcon,
    DocumentTextIcon,
    CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import axiosInstance from "../../Api/axios";

interface Passenger {
    type: string;
    title: string;
    givenName: string;
    surName: string;
    passport: string;
    dateOfBirth: string;
    passportExpiry?: string;
    nationality: string;
    documentUrl?: string | null;
    discount?: number
}

interface UmrahBooking {
    _id: string;
    bookingNumber: string;
    packageName: string;
    packageSource?: "zip-accounts" | "local-db";
    roomType?: string;
    specialRequests?: string;
    user: {
        _id: string;
        name: string;
        email: string;
        phone: string;
        role?: string;
        companyName?: string;
        agencyCode?: string;
        consultant?: string;
    };
    passengers: Passenger[];
    passengerCount: { adults: number; children: number; infants: number; total: number };
    pricing: { pricePerPerson: number; totalPrice: number; currency?: string };
    paymentStatus: {
        status: "Pending" | "Approved" | "Refunded" | "Paid";
        totalAmount: number;
        paidAmount?: number;
        remainingAmount?: number;
        amount?: number;
        method?: string;
        paymentDate?: string;
        receiptNumber?: string;
        receiptFile?: string;
        notes?: string;
        submittedBy?: string;
        reviewedBy?: string;
        reviewedAt?: string;
        rejectionReason?: string;
        approvalProofFile?: string;
        paymentHistory?: any[];
    };
    voucherStatus: {
        status: "Not Generated" | "Generated" | "Sent" | "Printed";
        voucherNumber?: string;
        sentDate?: string;
    };
    bookingStatus: "on hold" | "confirmed" | "cancelled";
    createdAt: string;
}

interface ModalData {
    bookingId: string;
    type: "payment" | "booking" | "details";
    booking: UmrahBooking;
}

const statusColorMap: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    Pending: { bg: "#FFFBEB", text: "#92400E", border: "#FDE68A", dot: "#F59E0B" },
    Approved: { bg: "#F0FDF4", text: "#166534", border: "#BBF7D0", dot: "#22C55E" },
    Refunded: { bg: "#FFF1F2", text: "#9F1239", border: "#FECDD3", dot: "#F43F5E" },
    Received: { bg: "#F0FDF4", text: "#166534", border: "#BBF7D0", dot: "#22C55E" },
    Rejected: { bg: "#FFF1F2", text: "#9F1239", border: "#FECDD3", dot: "#F43F5E" },
    "on hold": { bg: "#FFFBEB", text: "#92400E", border: "#FDE68A", dot: "#F59E0B" },
    "confirmed": { bg: "#F0FDF4", text: "#166534", border: "#BBF7D0", dot: "#22C55E" },
    "cancelled": { bg: "#FFF1F2", text: "#9F1239", border: "#FECDD3", dot: "#F43F5E" },
    "Not Generated": { bg: "#F8FAFC", text: "#475569", border: "#E2E8F0", dot: "#94A3B8" },
    Generated: { bg: "#EFF6FF", text: "#1E40AF", border: "#BFDBFE", dot: "#3B82F6" },
    Sent: { bg: "#F0FDF4", text: "#166534", border: "#BBF7D0", dot: "#22C55E" },
    Printed: { bg: "#FAF5FF", text: "#6B21A8", border: "#E9D5FF", dot: "#A855F7" },
};

function StatusBadge({ status }: { status: string }) {
    const c = statusColorMap[status] || { bg: "#F8FAFC", text: "#475569", border: "#E2E8F0", dot: "#94A3B8" };
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap"
            style={{ backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.dot }} />
            {status}
        </span>
    );
}

export default function UmrahPackagesBooking() {
    const [bookings, setBookings] = useState<UmrahBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [paymentFilter, setPaymentFilter] = useState("");
    const [modalData, setModalData] = useState<ModalData | null>(null);

    useEffect(() => { fetchBookings(); }, []);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const response = await getAllBookingsAdmin({ search: searchTerm });
            setBookings(response.data || []);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to fetch bookings");
        } finally {
            setLoading(false);
        }
    };

    const filteredBookings = bookings.filter((b) => {
        const s = searchTerm.toLowerCase();
        const matchSearch =
            b.bookingNumber.toLowerCase().includes(s) ||
            b.packageName.toLowerCase().includes(s) ||
            (b.user?.name || "").toLowerCase().includes(s) ||
            (b.passengers?.[0]?.givenName || "").toLowerCase().includes(s);
        const matchStatus = statusFilter ? b.bookingStatus === statusFilter : true;
        const matchPayment = paymentFilter ? b.paymentStatus.status === paymentFilter : true;
        return matchSearch && matchStatus && matchPayment;
    });

    const openModal = (bookingId: string, type: ModalData["type"], booking: UmrahBooking) =>
        setModalData({ bookingId, type, booking });

    const stats = [
        { label: "Total Bookings", value: bookings.length, color: "#2563EB", bg: "#EFF6FF", Icon: BuildingOffice2Icon },
        { label: "On Hold", value: bookings.filter(b => b.bookingStatus === "on hold").length, color: "#D97706", bg: "#FFFBEB", Icon: ExclamationTriangleIcon },
        { label: "Confirmed", value: bookings.filter(b => b.bookingStatus === "confirmed").length, color: "#059669", bg: "#F0FDF4", Icon: CheckCircleIcon },
        { label: "Cancelled", value: bookings.filter(b => b.bookingStatus === "cancelled").length, color: "#DC2626", bg: "#FFF1F2", Icon: XMarkIcon },
    ];

    return (
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-6 font-sans">
            <div className="max-w-360 mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-linear-to-br from-blue-900 to-blue-600 flex items-center justify-center shadow-lg">
                        <BuildingOffice2Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Umrah Package Bookings</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage and track all booking requests</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {stats.map(({ label, value, color, bg, Icon }) => (
                        <div key={label} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">{label}</p>
                                    <p className="text-2xl font-bold mt-1" style={{ color }}>{value}</p>
                                </div>
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: bg }}>
                                    <Icon className="w-5 h-5" style={{ color }} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl p-5 mb-6 border border-gray-200 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Search</label>
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    placeholder="Booking #, package, name..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Booking Status</label>
                            <div className="relative">
                                <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <select
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer bg-white"
                                    value={statusFilter}
                                    onChange={e => setStatusFilter(e.target.value)}
                                >
                                    <option value="">All</option>
                                    <option value="on hold">On Hold</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Payment Status</label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer bg-white"
                                value={paymentFilter}
                                onChange={e => setPaymentFilter(e.target.value)}
                            >
                                <option value="">All</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end mt-4">
                        <button
                            onClick={fetchBookings}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-blue-900 to-blue-600 text-white rounded-lg text-sm font-semibold hover:shadow-md transition-all"
                        >
                            <ArrowPathIcon className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Bookings Table */}
                {loading ? (
                    <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
                        <div className="inline-block w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
                        <p className="text-gray-500 mt-4">Loading bookings...</p>
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
                        <BuildingStorefrontIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No bookings found</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-linear-to-r from-blue-900 to-blue-800">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Booking</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Lead Passenger</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Agent</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">Payment</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredBookings.map((booking) => (
                                        <tr key={booking._id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1">
                                                        <HashtagIcon className="w-3 h-3 text-blue-600" />
                                                        <span className="text-xs font-bold text-blue-600">{booking.bookingNumber}</span>
                                                    </div>
                                                    <p className="text-sm font-medium text-gray-900">{booking.packageName}</p>
                                                    <div className="flex items-center gap-1">
                                                        <CurrencyDollarIcon className="w-3 h-3 text-green-600" />
                                                        <span className="text-xs font-bold text-green-600">
                                                            {booking.pricing?.currency || "PKR"}{" "}
                                                            {(
                                                                (booking.pricing?.totalPrice || 0) -
                                                                (booking.passengers?.reduce(
                                                                    (acc, passenger) => acc + (Number(passenger.discount) || 0),
                                                                    0
                                                                ) || 0)
                                                            ).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        {booking.passengers?.[0]?.title} {booking.passengers?.[0]?.givenName} {booking.passengers?.[0]?.surName}
                                                    </p>
                                                    <div className="flex items-center gap-1">
                                                        <IdentificationIcon className="w-3 h-3 text-gray-400" />
                                                        <span className="text-xs text-gray-500">{booking.passengers?.[0]?.passport}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <UserGroupIcon className="w-3 h-3 text-gray-400" />
                                                        <span className="text-xs text-gray-500">
                                                            {booking.passengerCount?.adults ?? 0}A · {booking.passengerCount?.children ?? 0}C · {booking.passengerCount?.infants ?? 0}I
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-semibold text-gray-900">{booking.user?.name || "N/A"}</p>
                                                    {booking.user?.companyName && (
                                                        <p className="text-xs text-gray-500">{booking.user.companyName}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="space-y-2">
                                                    <StatusBadge status={booking.paymentStatus.status} />
                                                    <button
                                                        onClick={() => openModal(booking._id, "payment", booking)}
                                                        className="text-xs font-semibold px-3 py-1 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition"
                                                    >
                                                        Review Payment
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="space-y-2">
                                                    <StatusBadge status={booking.bookingStatus} />
                                                    <select
                                                        value={booking.bookingStatus}
                                                        onChange={async (e) => {
                                                            try {
                                                                await updateBookingStatus(booking._id, { status: e.target.value });
                                                                toast.success("Booking status updated!");
                                                                fetchBookings();
                                                            } catch (error: any) {
                                                                toast.error(error.response?.data?.message || "Update failed");
                                                            }
                                                        }}
                                                        className="text-xs px-2 py-1 border border-gray-300 rounded-md cursor-pointer bg-white"
                                                    >
                                                        <option value="on hold">On Hold</option>
                                                        <option value="confirmed">Confirmed</option>
                                                        <option value="cancelled">Cancelled</option>
                                                    </select>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => openModal(booking._id, "details", booking)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-xs font-semibold hover:bg-gray-200 transition"
                                                >
                                                    <DocumentTextIcon className="w-3.5 h-3.5" />
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {modalData && (
                <BookingModal
                    modalData={modalData}
                    onClose={() => setModalData(null)}
                    onSuccess={() => { fetchBookings(); setModalData(null); }}
                />
            )}
        </div>
    );
}

// Booking Modal Component
function BookingModal({ modalData, onClose, onSuccess }: {
    modalData: ModalData;
    onClose: () => void;
    onSuccess: () => void;
}) {
    if (modalData.type === "payment") {
        return <PaymentModal modalData={modalData} onClose={onClose} onSuccess={onSuccess} />;
    }
    if (modalData.type === "details") {
        return <DetailsModal modalData={modalData} onClose={onClose} />;
    }
    return null;
}

// Payment Modal
function PaymentModal({ modalData, onClose, onSuccess }: {
    modalData: ModalData;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [formData, setFormData] = useState<any>({});
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const pendingPayment = modalData.booking.paymentStatus?.paymentHistory?.find(
                (p: any) => p.paymentStatus === "Pending"
            );

            if (!pendingPayment) {
                toast.error("No pending payment found");
                setLoading(false);
                return;
            }

            const data = new FormData();
            data.append("paymentId", pendingPayment._id || pendingPayment.id);
            data.append("paymentStatus", formData.paymentStatus);

            if (formData.paymentStatus === "Rejected") {
                data.append("rejectionReason", formData.rejectionReason || "");
            }

            if (file && formData.paymentStatus === "Approved") {
                data.append("approvalProofFile", file);
            }

            await reviewPayment(modalData.bookingId, data);
            toast.success("Payment status updated!");
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Update failed");
        } finally {
            setLoading(false);
        }
    };

    const pendingPayment = modalData.booking.paymentStatus?.paymentHistory?.find(
        (p: any) => p.paymentStatus === "Pending"
    );

    if (!pendingPayment) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-6">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Payment Found</h3>
                        <p className="text-gray-500 mb-6">No payment has been submitted for this booking yet.</p>
                        <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <CreditCardIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Review Payment</h2>
                            <p className="text-xs text-gray-500">{modalData.booking.bookingNumber}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition">
                        <XMarkIcon className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Payment Details Card */}
                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                        <h3 className="text-sm font-semibold text-green-800 mb-3">Submitted Payment Details</h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-gray-600">Amount</p>
                                <p className="font-semibold text-gray-900">PKR {pendingPayment.amount?.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Method</p>
                                <p className="font-semibold text-gray-900">{pendingPayment.method || "Bank Transfer"}</p>
                            </div>
                            {pendingPayment.bank?.bankName && (
                                <div className="col-span-2">
                                    <p className="text-gray-600">Bank</p>
                                    <p className="font-semibold text-gray-900">
                                        {pendingPayment.bank.bankName} — {pendingPayment.bank.accountTitle}
                                    </p>
                                    <p className="text-xs text-gray-500 font-mono">
                                        A/C: {pendingPayment.bank.accountNo} | IBAN: {pendingPayment.bank.ibn}
                                    </p>
                                </div>
                            )}
                            {pendingPayment.paymentDate && (
                                <div>
                                    <p className="text-gray-600">Date</p>
                                    <p className="font-semibold text-gray-900">{new Date(pendingPayment.paymentDate).toLocaleDateString()}</p>
                                </div>
                            )}
                            {pendingPayment.receiptNumber && (
                                <div>
                                    <p className="text-gray-600">Receipt #</p>
                                    <p className="font-semibold text-gray-900">{pendingPayment.receiptNumber}</p>
                                </div>
                            )}
                        </div>
                        {pendingPayment.receiptFile && (
                            <a href={pendingPayment.receiptFile} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 mt-3 text-sm text-blue-600 font-semibold hover:text-blue-700">
                                <PaperClipIcon className="w-4 h-4" />
                                View Receipt
                            </a>
                        )}
                        {pendingPayment.notes && (
                            <div className="mt-3 p-3 bg-white rounded-lg text-sm text-gray-700">
                                <strong>Notes:</strong> {pendingPayment.notes}
                            </div>
                        )}
                    </div>

                    {/* Current Status */}
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                        <p className="text-sm text-gray-600 mb-1">Current Status</p>
                        <p className="text-lg font-bold text-blue-900">{pendingPayment.paymentStatus || "Pending"}</p>
                        {pendingPayment.rejectionReason && (
                            <div className="mt-2 p-2 bg-red-50 rounded-lg text-sm text-red-700">
                                <strong>Rejection Reason:</strong> {pendingPayment.rejectionReason}
                            </div>
                        )}
                    </div>

                    {/* Update Form */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Update Status *</label>
                        <select
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            value={formData.paymentStatus || ""}
                            onChange={e => setFormData({ ...formData, paymentStatus: e.target.value })}
                        >
                            <option value="">Select Status</option>
                            <option value="Approved">Approve Payment</option>
                            <option value="Rejected">Reject Payment</option>
                        </select>
                    </div>

                    {formData.paymentStatus === "Rejected" && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Rejection Reason *</label>
                            <textarea
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                                rows={3}
                                value={formData.rejectionReason || ""}
                                onChange={e => setFormData({ ...formData, rejectionReason: e.target.value })}
                                placeholder="Explain why this payment is being rejected..."
                            />
                        </div>
                    )}

                    {formData.paymentStatus === "Approved" && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Approval Proof (Optional)</label>
                            <input
                                type="file"
                                accept="image/*,application/pdf"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                onChange={e => setFile(e.target.files?.[0] || null)}
                            />
                            {file && (
                                <p className="text-xs text-gray-500 mt-1">Selected: {file.name}</p>
                            )}
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex-1 px-4 py-2 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50">
                            {loading ? "Updating..." : "Update Payment"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Details Modal
function DetailsModal({ modalData, onClose }: {
    modalData: ModalData;
    onClose: () => void;
}) {
    // const booking = modalData.booking;
    const [booking, setBooking] = useState<UmrahBooking>(modalData.booking);
    const totalDiscount =
        booking.passengers?.reduce(
            (acc, passenger) => acc + (Number(passenger.discount) || 0),
            0
        ) || 0;

    const finalTotal =
        (booking.pricing?.totalPrice || 0) - totalDiscount;

    const handleSaveDiscount = async (
        bookingId: string,
        passengers: Passenger[]
    ) => {
        try {
            const res = await axiosInstance.patch(
                "/umrah-bookings/savePassengerDiscounts",
                {
                    bookingId,
                    passengers
                }
            )

            if (res.data.success) {
                alert("Passenger discounts saved successfully")
            }
        } catch (error) {
            console.error("Error saving discounts:", error)
            alert("Failed to save discounts")
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <DocumentTextIcon className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Booking Details</h2>
                            <p className="text-xs text-gray-500">{booking.bookingNumber}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition">
                        <XMarkIcon className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Booking Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-xl p-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <BuildingOffice2Icon className="w-4 h-4" />
                                Booking Information
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div><span className="text-gray-500">Package:</span> <span className="font-medium">{booking.packageName}</span></div>
                                <div><span className="text-gray-500">Room Type:</span> <span className="font-medium capitalize">{booking.roomType || "N/A"}</span></div>
                                <div><span className="text-gray-500">Created:</span> <span className="font-medium">{new Date(booking.createdAt).toLocaleString()}</span></div>
                                <div><span className="text-gray-500">Special Requests:</span> <span className="font-medium">{booking.specialRequests || "None"}</span></div>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <UserGroupIcon className="w-4 h-4" />
                                Passenger Summary
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div><span className="text-gray-500">Total Passengers:</span> <span className="font-medium">{booking.passengerCount.total}</span></div>
                                <div><span className="text-gray-500">Adults:</span> <span className="font-medium">{booking.passengerCount.adults}</span></div>
                                <div><span className="text-gray-500">Children:</span> <span className="font-medium">{booking.passengerCount.children}</span></div>
                                <div><span className="text-gray-500">Infants:</span> <span className="font-medium">{booking.passengerCount.infants}</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Agent Info */}
                    <div className="bg-gray-50 rounded-xl p-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <IdentificationIcon className="w-4 h-4" />
                            Agent Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div><span className="text-gray-500">Name:</span> <span className="font-medium">{booking.user?.name || "N/A"}</span></div>
                            <div><span className="text-gray-500">Email:</span> <span className="font-medium">{booking.user?.email || "N/A"}</span></div>
                            <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{booking.user?.phone || "N/A"}</span></div>
                            <div><span className="text-gray-500">Company:</span> <span className="font-medium">{booking.user?.companyName || "N/A"}</span></div>
                            <div><span className="text-gray-500">Agency Code:</span> <span className="font-medium">{booking.user?.agencyCode || "N/A"}</span></div>
                        </div>
                    </div>

                    {/* Passengers List */}
                    <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex justify-between mb-2">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <UserGroupIcon className="w-4 h-4" />
                                All Passengers
                            </h3>
                            <button
                                onClick={() => handleSaveDiscount(booking._id, booking.passengers)}
                                className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
                            >
                                Save Discount
                            </button>
                        </div>
                        <div className="space-y-3">
                            {booking.passengers.map((passenger, idx) => (
                                <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-semibold text-gray-900">
                                            {passenger.title} {passenger.givenName} {passenger.surName}
                                        </p>
                                        <StatusBadge status={passenger.type} />
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                                        <div><span className="text-gray-400">Passport:</span> {passenger.passport}</div>
                                        <div><span className="text-gray-400">DOB:</span> {new Date(passenger.dateOfBirth).toLocaleDateString()}</div>
                                        <div><span className="text-gray-400">Nationality:</span> {passenger.nationality}</div>
                                        {passenger.passportExpiry && (
                                            <div><span className="text-gray-400">Expiry:</span> {new Date(passenger.passportExpiry).toLocaleDateString()}</div>
                                        )}
                                    </div>
                                    {passenger.documentUrl && (
                                        <a href={passenger.documentUrl} target="_blank" rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 font-semibold">
                                            <PaperClipIcon className="w-3 h-3" />
                                            View Passport Document
                                        </a>
                                    )}
                                    <div className="ms-auto">
                                        <label className="text-xs text-gray-500 mb-1">Discount (PKR) &ensp;</label>

                                        <input
                                            type="number"
                                            value={passenger.discount || ""}
                                            onChange={(e) => {
                                                const updatedPassengers = [...booking.passengers];

                                                updatedPassengers[idx] = {
                                                    ...updatedPassengers[idx],
                                                    discount: Number(e.target.value),
                                                };

                                                setBooking({
                                                    ...booking,
                                                    passengers: updatedPassengers,
                                                });
                                            }}
                                            placeholder="0"
                                            className="w-24 ms-auto px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pricing & Payment */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-xl p-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <CurrencyDollarIcon className="w-4 h-4" />
                                Pricing Details
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div><span className="text-gray-500">Price Per Person:</span> <span className="font-medium">PKR {booking.pricing.pricePerPerson?.toLocaleString()}</span></div>
                                <div>
                                    <span className="text-gray-500">Original Total:</span>{" "}
                                    <span className="font-medium">
                                        PKR {booking.pricing.totalPrice?.toLocaleString()}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-gray-500">Passenger Discount:</span>{" "}
                                    <span className="font-medium text-red-600">
                                        - PKR {totalDiscount.toLocaleString()}
                                    </span>
                                </div>

                                <div className="pt-2 border-t border-gray-200">
                                    <span className="text-gray-500">Final Total:</span>{" "}
                                    <span className="font-bold text-green-600">
                                        PKR {finalTotal.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <CreditCardIcon className="w-4 h-4" />
                                Payment Summary
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div><span className="text-gray-500">Status:</span> <StatusBadge status={booking.paymentStatus.status} /></div>
                                <div><span className="text-gray-500">Total Amount:</span> <span className="font-medium">PKR {booking.paymentStatus.totalAmount?.toLocaleString()}</span></div>
                                <div><span className="text-gray-500">Paid Amount:</span> <span className="font-medium">PKR {booking.paymentStatus.paidAmount?.toLocaleString() || 0}</span></div>
                                <div><span className="text-gray-500">Remaining:</span> <span className="font-medium">PKR {booking.paymentStatus.remainingAmount?.toLocaleString() || booking.paymentStatus.totalAmount?.toLocaleString()}</span></div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button onClick={onClose} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}