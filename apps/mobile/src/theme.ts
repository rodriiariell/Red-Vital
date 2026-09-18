import { Platform } from "react-native";
export const colors = { red: "#D62839", burgundy: "#861F41", coral: "#F25F5C", background: "#FFF9F7", white: "#FFFFFF", text: "#202733", secondary: "#667085", green: "#16865C", border: "#E8DCD8", muted: "#F6ECE9" } as const;
export const spacing = { xs: 6, sm: 10, md: 16, lg: 24, xl: 32 } as const;
export const shadow = Platform.select({ ios: { shadowColor: "#861F41", shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 3 }, default: {} });
