export const theme = {
  colors: {
    // Primary - Dark Blue + Purple Theme
    primary: "linear-gradient(135deg, #750B0B, #D92B2B, #C22525)",
    primaryDark: "#141042", // Deep Indigo
    primaryLight: "#7C3AED", // Violet 600
    primaryLighter: "#EDE9FE", // Violet 100

    // Main Gradient Colors
    gradientStart: "#1E1B4B", // Dark Indigo
    gradientMiddle: "#312E81", // Indigo
    gradientEnd: "#6D28D9", // Purple
    mainGradient:
      "linear-gradient(90deg, #1E1B4B 0%, #312E81 50%, #6D28D9 100%)",

    // Secondary Colors
    secondary: "#64748b",
    secondaryDark: "#334155",
    secondaryLight: "#f8fafc",

    // Accent - Soft Purple
    accent: "#D92B2B",
    accentDark: "#5B21B6",
    accentLight: "#A78BFA",

    // Backgrounds
    background: "#F5F7FF",
    backgroundDark: "#EEF2FF",

    // UI Elements
    card: "#ffffff",
    border: "#DDE3F0",
    borderDark: "#B8C1D9",

    // Sidebar
    sidebarBg: "#0F172A",
    sidebarText: "#94A3B8",
    sidebarTextLight: "#F8FAFC",
    sidebarHover: "#1E293B",
    sidebarActive: "#6D28D9",
    sidebarActiveBg: "linear-gradient(90deg, #312E81 0%, #6D28D9 100%)",
    sidebarBorder: "#1E293B",

    // Status Colors
    danger: "#E11D48",
    dangerLight: "#FFF1F2",

    success: "#4F46E5", // Indigo
    successLight: "#EEF2FF",

    warning: "#D97706",
    warningLight: "#FFFBEB",

    info: "#7C3AED",
    infoLight: "#F3E8FF",

    // Text Colors
    textPrimary: "#0F172A",
    textSecondary: "#334155",
    textTertiary: "#64748B",
    textLight: "#CBD5E1",
  },

  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    xxl: "48px",
  },

  borderRadius: {
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    full: "9999px",
  },

  shadows: {
    sm: "0 1px 3px 0 rgba(30, 27, 75, 0.08)",
    md: "0 4px 6px -1px rgba(30, 27, 75, 0.12), 0 2px 4px -2px rgba(30, 27, 75, 0.08)",
    lg: "0 10px 15px -3px rgba(30, 27, 75, 0.15), 0 4px 6px -4px rgba(30, 27, 75, 0.1)",
    xl: "0 20px 25px -5px rgba(30, 27, 75, 0.18), 0 8px 10px -6px rgba(30, 27, 75, 0.12)",
    inner: "inset 0 2px 4px 0 rgba(30, 27, 75, 0.08)",
  },

  transitions: {
    default: "all 0.2s ease",
    smooth: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    fast: "all 0.1s ease-in-out",
  },

  breakpoints: {
    mobile: "768px",
    tablet: "1024px",
    desktop: "1280px",
  },

  cards: {
    groups: "text-indigo-700 bg-indigo-50 border-indigo-100",
    bank: "text-violet-700 bg-violet-50 border-violet-100",
    payment: "text-slate-700 bg-slate-50 border-slate-100",
    ledger: "text-purple-700 bg-purple-50 border-purple-100",
    profile: "text-indigo-700 bg-indigo-50 border-indigo-100",
  },
};
