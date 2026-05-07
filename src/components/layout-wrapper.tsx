"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import Navbar from "./navbar";
import Footer from "./footer";
import { checkAutoLogout } from "../utils/auth";
import toast from "react-hot-toast";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideFooter = pathname === "/login" || pathname === "/register" || pathname === "/kuesioner" || pathname === "/kuesioner/result"
  const hideNavbar = pathname === "/login" || pathname === "/register" || pathname.startsWith("/chats/") || pathname === "/kuesioner/result" || pathname === "/kuesioner" 

  useEffect(() => {
    const verifySession = async () => {
      const isLoggedOut = await checkAutoLogout();
      if (isLoggedOut) {
        toast("Sesi login berakhir. Silakan login kembali.", {
          icon: '⏳',
          style: { borderRadius: '10px', background: '#333', color: '#fff' }
        });
      }
    };
    verifySession();
  }, [pathname]);

  return (
    <>
      {!hideFooter && <Navbar />}
      <main className="flex-grow">{children}</main>
      {!hideNavbar && <Footer />}
    </>
  );
}