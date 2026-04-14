"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/src/app/context/ThemeContext";
import { UserProvider } from "@/src/app/components/additionals/userContext";

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <UserProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </UserProvider>
    </SessionProvider>
  );
}
