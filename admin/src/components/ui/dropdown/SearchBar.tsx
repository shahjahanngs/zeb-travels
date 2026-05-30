import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router";

interface RouteItem {
    label: string;
    path: string;
    icon: string;
    category: string;
    keywords?: string[];
}

const ROUTES: RouteItem[] = [
    { label: "Dashboard", path: "/", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", category: "Main" },
    { label: "All Bookings", path: "/all-bookings", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", category: "Bookings", keywords: ["tickets", "reservations"] },
    { label: "Group Ticketing", path: "/group-ticketing", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0", category: "Bookings", keywords: ["groups", "bulk"] },
    { label: "Umrah Packages Booking", path: "/umrah-pkg-bookings", icon: "M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7", category: "Bookings", keywords: ["umrah", "hajj", "package"] },
    { label: "Registered Agencies", path: "/registered-agencies", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4", category: "Management", keywords: ["agencies", "agents"] },
    { label: "Special Offers", path: "/special-offers", icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z", category: "Management", keywords: ["deals", "discount", "promo"] },
    { label: "Manage Sectors", path: "/manage-sectors", icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7", category: "Management", keywords: ["sector", "route", "city"] },
    { label: "All Groups", path: "/all-groups", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0", category: "Management" },
    { label: "API Groups", path: "/api-groups", icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4", category: "Management", keywords: ["api", "integration"] },
    { label: "Create Umrah Package", path: "/create-package", icon: "M12 4v16m8-8H4", category: "Umrah", keywords: ["new", "add", "umrah"] },
    { label: "Manage Umrah Packages", path: "/manage-package", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z", category: "Umrah", keywords: ["edit", "update", "umrah"] },
    { label: "View Accounts", path: "/view-accounts", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z", category: "Finance", keywords: ["accounts", "finance"] },
    { label: "View Payment Voucher", path: "/view-payment-voucher", icon: "M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z", category: "Finance", keywords: ["voucher", "payment"] },
    { label: "Bank Ledger", path: "/bank-ledger", icon: "M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z", category: "Finance", keywords: ["bank", "ledger", "transactions"] },
    { label: "Add Bank", path: "/add-bank", icon: "M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z", category: "Finance", keywords: ["bank", "add"] },
    { label: "Sector", path: "/sector", icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945", category: "Settings", keywords: ["sector"] },
    { label: "Airline", path: "/airline", icon: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8", category: "Settings", keywords: ["airline", "carrier"] },
    { label: "Hotel", path: "/hotel", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", category: "Settings", keywords: ["hotel", "accommodation"] },
    { label: "Transport", path: "/transport", icon: "M8 17h8m-4-4v4m0 0V9m0 0H5l3-6h8l3 6h-7z", category: "Settings", keywords: ["transport", "vehicle"] },
    { label: "User Profile", path: "/profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", category: "Account" },
    { label: "Change Password", path: "/change-password", icon: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z", category: "Account", keywords: ["password", "security"] },
    { label: "Manage User Passwords", path: "/manage-user-passwords", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z", category: "Account", keywords: ["password", "users", "admin"] },
    { label: "Calendar", path: "/calendar", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", category: "Other" },
];

function scoreMatch(item: RouteItem, query: string): number {
    const q = query.toLowerCase();
    const label = item.label.toLowerCase();
    const path = item.path.toLowerCase();
    const keywords = (item.keywords || []).join(" ").toLowerCase();
    const category = item.category.toLowerCase();

    if (label === q) return 100;
    if (label.startsWith(q)) return 90;
    if (label.includes(q)) return 75;
    if (path.includes(q)) return 60;
    if (keywords.includes(q)) return 55;
    if (category.includes(q)) return 40;

    // fuzzy: all chars in query appear in label in order
    let idx = 0;
    for (const ch of q) {
        const found = label.indexOf(ch, idx);
        if (found === -1) return 0;
        idx = found + 1;
    }
    return 20;
}

const CATEGORY_COLORS: Record<string, string> = {
    Main: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    Bookings: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    Management: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    Umrah: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    Finance: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    Settings: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
    Account: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    Other: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
};

export function SearchBar() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<RouteItem[]>([]);
    const [activeIdx, setActiveIdx] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const search = useCallback((q: string) => {
        if (!q.trim()) {
            setResults([]);
            setIsOpen(false);
            return;
        }
        const scored = ROUTES
            .map((r) => ({ item: r, score: scoreMatch(r, q) }))
            .filter((x) => x.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 7)
            .map((x) => x.item);
        setResults(scored);
        setIsOpen(scored.length > 0);
        setActiveIdx(0);
    }, []);

    useEffect(() => {
        search(query);
    }, [query, search]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node) &&
                !inputRef.current?.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIdx((i) => Math.min(i + 1, results.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIdx((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (results[activeIdx]) {
                navigate(results[activeIdx].path);
                setQuery("");
                setIsOpen(false);
                inputRef.current?.blur();
            }
        } else if (e.key === "Escape") {
            setIsOpen(false);
            inputRef.current?.blur();
        }
    };

    const handleSelect = (path: string) => {
        navigate(path);
        setQuery("");
        setIsOpen(false);
        inputRef.current?.blur();
    };

    return (
        <div className="relative hidden lg:block">
            {/* Input */}
            <div className="relative">
                <span className="absolute -translate-y-1/2 pointer-events-none left-4 top-1/2">
                    <svg
                        className="fill-gray-500 dark:fill-gray-400"
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
                        />
                    </svg>
                </span>

                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => query && setIsOpen(results.length > 0)}
                    placeholder="Search or type command..."
                    className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-107.5"
                    autoComplete="off"
                />

                <button className="absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 px-1.75 py-[4.5px] text-xs tracking-[-0.2px] text-gray-500 dark:border-gray-800 dark:bg-white/0.03 dark:text-gray-400">
                    <span>⌘</span>
                    <span>K</span>
                </button>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div
                    ref={dropdownRef}
                    className="absolute left-0 right-0 top-[calc(100%+8px)] z-99999 rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900 overflow-hidden"
                >
                    <ul className="py-1.5 max-h-80 overflow-y-auto">
                        {results.map((item, i) => (
                            <li key={item.path}>
                                <button
                                    onMouseEnter={() => setActiveIdx(i)}
                                    onClick={() => handleSelect(item.path)}
                                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === activeIdx
                                        ? "bg-gray-100 dark:bg-gray-800"
                                        : "hover:bg-gray-50 dark:hover:bg-gray-800/60"
                                        }`}
                                >
                                    {/* Icon */}
                                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${i === activeIdx
                                        ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
                                        : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                                        }`}>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={1.8}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                                        </svg>
                                    </span>

                                    {/* Label + category */}
                                    <span className="flex flex-1 items-center justify-between min-w-0">
                                        <span className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                                            {item.label}
                                        </span>
                                        <span className={`ml-3 shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS.Other}`}>
                                            {item.category}
                                        </span>
                                    </span>

                                    {/* Enter hint on active */}
                                    {i === activeIdx && (
                                        <span className="shrink-0 rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[11px] text-gray-400 dark:border-gray-700 dark:bg-gray-800">
                                            ↵
                                        </span>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>

                    <div className="border-t border-gray-100 px-4 py-2 dark:border-gray-800">
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                            <span className="font-medium">↑↓</span> navigate &nbsp;·&nbsp;
                            <span className="font-medium">↵</span> open &nbsp;·&nbsp;
                            <span className="font-medium">Esc</span> close
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}