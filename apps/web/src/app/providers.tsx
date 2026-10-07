"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { AuthProvider } from "@/context/auth-context";
import { AccountProvider } from "@/context/account-context";

export default function Providers({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  const publicPages = [
    "/login",
    "/register",
    "/onboarding",
  ];

  const isPublicPage = publicPages.some(
    (page) =>
      pathname === page ||
      pathname.startsWith(`${page}/`),
  );

  return (
    <AuthProvider>
      {isPublicPage ? (
        children
      ) : (
        <AccountProvider>
          {children}
        </AccountProvider>
      )}
    </AuthProvider>
  );
}