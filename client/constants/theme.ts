import { Platform } from "react-native";

const primaryBlue = "#1B5E96";
const primaryBlueDark = "#2A7BB8";

export const Colors = {
  light: {
    text: "#1A1A1A",
    textSecondary: "#6B7280",
    buttonText: "#FFFFFF",
    tabIconDefault: "#687076",
    tabIconSelected: primaryBlue,
    link: primaryBlue,
    backgroundRoot: "#FFFFFF",
    backgroundDefault: "#F8F9FA",
    backgroundSecondary: "#F2F2F2",
    backgroundTertiary: "#E5E7EB",
    border: "#E5E7EB",
    success: "#059669",
    error: "#DC2626",
    clubs: "#1A1A1A",
    diamonds: "#D4692C",
    hearts: "#DC2626",
    spades: "#1A1A1A",
    noTrump: "#1B5E96",
    pass: "#059669",
    double: "#DC2626",
    redouble: "#7C3AED",
    alertActive: "#F59E0B",
  },
  dark: {
    text: "#ECEDEE",
    textSecondary: "#9BA1A6",
    buttonText: "#FFFFFF",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: primaryBlueDark,
    link: primaryBlueDark,
    backgroundRoot: "#1F2123",
    backgroundDefault: "#2A2C2E",
    backgroundSecondary: "#353739",
    backgroundTertiary: "#404244",
    border: "#404244",
    success: "#10B981",
    error: "#EF4444",
    clubs: "#ECEDEE",
    diamonds: "#F59E0B",
    hearts: "#EF4444",
    spades: "#ECEDEE",
    noTrump: "#3B82F6",
    pass: "#10B981",
    double: "#EF4444",
    redouble: "#A78BFA",
    alertActive: "#FBBF24",
  },
};

export const BridgeColors = {
  clubs: "#1A1A1A",
  clubsLight: "#ECEDEE",
  diamonds: "#D4692C",
  hearts: "#DC2626",
  spades: "#1A1A1A",
  spadesLight: "#ECEDEE",
  noTrump: "#1B5E96",
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 42,
  buttonHeight: 44,
  bidButtonSize: 42,
  suitButtonSize: 48,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  bid: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "500" as const,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
