/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    // Primary brand colors - Darker Blue
    primary: "#1d4ed8",
    primaryDark: "#1e40af",
    primaryLight: "#2563eb",

    // Secondary colors - Sky Blue
    secondary: "#0ea5e9",
    secondaryDark: "#0284c7",
    secondaryLight: "#38bdf8",

    // Accent colors - Teal
    accent: "#14b8a6",
    accentDark: "#0d9488",
    accentLight: "#2dd4bf",

    // Success, warning, error
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",

    // Text colors
    text: "#0f172a",
    textSecondary: "#475569",
    textTertiary: "#94a3b8",

    // Background colors
    background: "#f8fafc",
    backgroundSecondary: "#f1f5f9",
    backgroundTertiary: "#e2e8f0",

    // Card & surface
    card: "#ffffff",
    cardBorder: "#e2e8f0",

    // Input colors
    input: "#ffffff",
    inputBorder: "#cbd5e1",
    inputFocus: "#1d4ed8",
    placeholder: "#94a3b8",

    // Tab & navigation
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#94a3b8",
    tabIconSelected: "#1d4ed8",

    // Shadows & overlays
    shadow: "#000000",
    overlay: "rgba(0, 0, 0, 0.5)",
  },
  dark: {
    // Primary brand colors - Blue for dark mode
    primary: "#60a5fa",
    primaryDark: "#3b82f6",
    primaryLight: "#93c5fd",

    // Secondary colors - Sky Blue for dark mode
    secondary: "#38bdf8",
    secondaryDark: "#0ea5e9",
    secondaryLight: "#7dd3fc",

    // Accent colors - Brighter Teal
    accent: "#2dd4bf",
    accentDark: "#14b8a6",
    accentLight: "#5eead4",

    // Success, warning, error
    success: "#34d399",
    warning: "#fbbf24",
    error: "#f87171",

    // Text colors
    text: "#f1f5f9",
    textSecondary: "#cbd5e1",
    textTertiary: "#94a3b8",

    // Background colors - Complete black
    background: "#000000",
    backgroundSecondary: "#0a0a0a",
    backgroundTertiary: "#171717",

    // Card & surface
    card: "#0a0a0a",
    cardBorder: "#262626",

    // Input colors
    input: "#171717",
    inputBorder: "#262626",
    inputFocus: "#a78bfa",
    placeholder: "#737373",

    // Tab & navigation
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#737373",
    tabIconSelected: "#a78bfa",

    // Shadows & overlays
    shadow: "#000000",
    overlay: "rgba(0, 0, 0, 0.85)",
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
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
