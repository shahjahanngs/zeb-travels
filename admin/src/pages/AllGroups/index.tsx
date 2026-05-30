import { useEffect, useState } from "react";
import axiosInstance from "../../Api/axios";
import PageMeta from "../../components/common/PageMeta";
import { toast } from "react-toastify";

// ─── Icons (Simplified from your Admin style) ───────────────────────────────

const PlaneSVG = ({ className = "" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em">
        <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
    </svg>
);

const SuitcaseSVG = ({ className = "" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em">
        <path d="M20 7h-3V6a3 3 0 0 0-3-3H10a3 3 0 0 0-3 3v1H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM9 6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1H9V6zm11 14H4V9h16v11z" />
    </svg>
);

const RefreshSVG = ({ className = "" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="1em" height="1em">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface FlightDetail {
    flight_no: string;
    flight_date: string;
    dep_date?: string;
    dept_time: string;
    arv_date: string;
    arv_time: string;
    origin: string;
    destination: string;
    baggage?: string;
    meal?: string;
}

interface GroupEntry {
    id: string | number;
    groupName?: string;
    airline: {
        airline_name: string;
        logo_url: string | null;
    } | null;
    sector: string;
    price: number;
    available_no_of_pax: number;
    dept_date: string;
    details: FlightDetail[];
    isOwnGroup?: boolean; // Flag to identify source
    type?: string;
}

interface GroupedData {
    airline: string;
    airlineLogo: string | null;
    sector: string;
    groups: GroupEntry[];
}

export default function AllGroupsAdmin() {
    const [groups, setGroups] = useState<GroupEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAllGroups = async () => {
        try {
            setLoading(true);
            // Using the unified endpoint that returns both Own and API groups
            const res = await axiosInstance.get("/sector/getUnifiedGroups");
            if (res.data?.success) {
                setGroups(res.data.data || []);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to load all groups");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllGroups();
    }, []);

    // ── Grouping Logic (Airline × Sector) ────────────────────────────────────
    const grouped = groups.reduce<Record<string, GroupedData>>((acc, group) => {
        const airlineName = group.airline?.airline_name || "Unknown";
        const sector = (group.sector || "Unknown").toUpperCase().trim();
        const key = `${airlineName}||${sector}`;

        if (!acc[key]) {
            acc[key] = {
                airline: airlineName,
                airlineLogo: group.airline?.logo_url || null,
                sector,
                groups: [],
            };
        }
        acc[key].groups.push(group);
        return acc;
    }, {});

    const LoadingSkeleton = () => (
        <div className="space-y-6 p-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                    <div className="h-12 rounded-2xl bg-gray-200 mb-4 w-full" />
                    <div className="h-24 bg-gray-100 rounded-2xl mb-3" />
                </div>
            ))}
        </div>
    );

    return (
        <>
            <PageMeta
                title="All Active Groups | Admin"
                description="View all Own and API flight groups in one place"
            />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 min-h-screen">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white">All Active Groups</h1>

                    <button
                        onClick={fetchAllGroups}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700 transition disabled:opacity-50"
                    >
                        <RefreshSVG className={`${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                </div>

                {loading ? (
                    <LoadingSkeleton />
                ) : groups.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        No active groups found.
                    </div>
                ) : (
                    <div className="space-y-6">
                        {Object.entries(grouped).map(([key, data]) => {
                            const sectorParts = data.sector?.split("-") || [];
                            const origin = sectorParts[0] || "";
                            const destination = sectorParts[sectorParts.length - 1] || data.sector;

                            return (
                                <div key={key} className="rounded-2xl overflow-hidden border border-neutral-200 shadow-sm">
                                    {/* Group Header */}
                                    <div className="flex items-center justify-center gap-8 py-3 bg-gray-50 border-b border-neutral-200">
                                        <div className="flex items-center justify-center min-w-20">
                                            {data.airlineLogo ? (
                                                <img src={data.airlineLogo} alt={data.airline} className="h-10 object-contain" />
                                            ) : (
                                                <span className="font-bold text-gray-700">{data.airline}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <PlaneSVG className="text-blue-600 text-lg" />
                                            <span className="font-black text-xl tracking-tighter text-gray-800 uppercase">
                                                {data.sector}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Table */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="text-white text-[11px] uppercase tracking-wider font-bold" style={{ background: "linear-gradient(90deg, #1e293b 0%, #334155 100%)" }}>
                                                    <th className="px-4 py-3 text-left">Date</th>
                                                    <th className="px-4 py-3 text-left">Flight</th>
                                                    <th className="px-4 py-3 text-center">Route & Time</th>
                                                    <th className="px-4 py-3 text-center">Baggage</th>
                                                    <th className="px-4 py-3 text-center">Meal</th>
                                                    <th className="px-4 py-3 text-center">Seats</th>
                                                    <th className="px-4 py-3 text-center">Base Price</th>
                                                    <th className="px-4 py-3 text-center">Source</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.groups.sort((a, b) => a.dept_date.localeCompare(b.dept_date)).map((group) => {
                                                    const flight = group.details?.[0];
                                                    const lastFlight = group.details?.[group.details.length - 1];

                                                    return (
                                                        <tr key={group.id} className="border-b border-gray-100 bg-white hover:bg-blue-50/30 transition-colors">
                                                            <td className="px-4 py-4 text-xs font-semibold text-gray-700">
                                                                {new Date(group.dept_date).toLocaleDateString("en-GB", {
                                                                    day: "2-digit",
                                                                    month: "short",
                                                                    year: "numeric"
                                                                })}
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <span className="text-sm font-bold text-blue-700">
                                                                    {flight?.flight_no || "—"}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <div className="text-right">
                                                                        <div className="text-xs font-bold">{origin}</div>
                                                                        <div className="text-[10px] text-gray-500">{flight?.dept_time?.substring(0, 5)}</div>
                                                                    </div>
                                                                    <div className="flex items-center relative w-12">
                                                                        <div className="h-px w-full bg-gray-300" />
                                                                        <PlaneSVG className="absolute left-1/2 -translate-x-1/2 text-[10px] text-gray-400" />
                                                                    </div>
                                                                    <div className="text-left">
                                                                        <div className="text-xs font-bold">{destination}</div>
                                                                        <div className="text-[10px] text-gray-500">{(lastFlight?.arv_time || flight?.arv_time)?.substring(0, 5)}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4 text-center">
                                                                <div className="inline-flex items-center gap-1 text-xs">
                                                                    <SuitcaseSVG className="text-gray-400" />
                                                                    <span>{flight?.baggage || "0"}KG</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4 text-center">
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${flight?.meal && flight.meal !== "No" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                                                    {flight?.meal && flight.meal !== "No" ? "MEAL" : "NO"}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-4 text-center font-bold text-sm">
                                                                {group.available_no_of_pax}
                                                            </td>
                                                            <td className="px-4 py-4 text-center">
                                                                <span className="text-sm font-bold text-emerald-600">
                                                                    PKR {group.price.toLocaleString()}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-4 text-center">
                                                                {group.isOwnGroup ? (
                                                                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-purple-100 text-purple-700 border border-purple-200">
                                                                        OWN GROUP
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-blue-100 text-blue-700 border border-blue-200">
                                                                        SABAOON API
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}