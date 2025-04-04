import type { Metadata } from "next";
import "./globals.css";
import "react-calendar/dist/Calendar.css";
import { Header } from "@/components/Header";
import { SideBar } from "@/components/SideBar";
import { NoticeSideBar } from "@/components/NoticeSideBar";
import { pretendard } from "./fonts/pretendard";
import { Modal } from "@/components/Modal";
import { ThemeProvider } from "next-themes";
import { DimmedLayer } from "@/components/DimmedLayer";

export const metadata: Metadata = {
  title: "MapleDot: 메닷",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${pretendard.variable} font-pretendard bg-white dark:bg-[#131313]`}>
        <ThemeProvider attribute="class" defaultTheme="system">
          <Header />
          <Modal />
          <div className="flex flex-row gap-4 justify-center">
            <SideBar />
            {children}
            {/* <NoticeSideBar /> */}
          </div>
          <div className="flex mt-auto pb-3">Footer</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
