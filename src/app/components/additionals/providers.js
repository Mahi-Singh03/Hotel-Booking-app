"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/src/app/context/ThemeContext";

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </SessionProvider>
  );
}
