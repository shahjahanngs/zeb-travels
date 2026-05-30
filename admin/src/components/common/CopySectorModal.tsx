import { useState } from "react";
import {
    UnifiedGroup,
    buildSectorCopyText,
    copyToClipboard,
    getAvailableSectors,
} from "../../utils/copyFlightData";

interface CopySectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    groups: UnifiedGroup[];
}

export default function CopySectorModal({ isOpen, onClose, groups }: CopySectorModalProps) {
    const [copiedSector, setCopiedSector] = useState<string | null>(null);

    const handleCopySector = async (sector: string) => {
        const text = buildSectorCopyText(groups, sector);
        if (!text) {
            alert("No data available for this sector");
            return;
        }
        await copyToClipboard(text);
        setCopiedSector(sector);
        setTimeout(() => setCopiedSector(null), 2500);
    };

    const availableSectors = getAvailableSectors(groups);

    return (
        <div
            className={`fixed inset-0 bg-black/20 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-99999 transition-all duration-300 ease-in-out
                ${isOpen ? "visible opacity-100 translate-y-0" : "invisible opacity-0 translate-y-4"}`}
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-boxdark rounded-lg shadow-lg max-w-md w-full mx-4 max-h-150 overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 border-b border-stroke px-6 py-4 dark:border-strokedark bg-white dark:bg-boxdark flex justify-between items-center">
                    <h3 className="font-medium text-black dark:text-white">Copy Sector Data</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {availableSectors.length > 0 ? (
                        <div className="space-y-3">
                            {availableSectors.map((sector) => {
                                const sectorCount = groups.filter(
                                    (g) =>
                                        g.sector === sector &&
                                        (g.available_no_of_pax === undefined || g.available_no_of_pax > 0)
                                ).length;

                                return (
                                    <div
                                        key={sector}
                                        className="flex items-center justify-between p-3 border border-stroke dark:border-strokedark rounded-lg hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors"
                                    >
                                        <div>
                                            <p className="font-medium text-black dark:text-white">{sector}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {sectorCount} flights
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleCopySector(sector)}
                                            style={{
                                                backgroundColor: copiedSector === sector ? "#22c55e" : "#3b82f6",
                                            }}
                                            className="px-3 py-1 rounded text-white text-sm font-medium transition-all cursor-pointer"
                                        >
                                            {copiedSector === sector ? (
                                                <span className="flex items-center gap-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Copied
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                                        />
                                                    </svg>
                                                    Copy
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400">No sectors available</p>
                    )}
                </div>
            </div>
        </div>
    );
}
