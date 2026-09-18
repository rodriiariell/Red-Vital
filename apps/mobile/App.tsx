import React from "react";
import { StatusBar } from "expo-status-bar";
import { SessionProvider } from "./src/session";
import { Navigation } from "./src/navigation";
export default function App() { return <SessionProvider><StatusBar style="dark" /><Navigation /></SessionProvider>; }
