import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShopFusion",
  description: "Shop floor meets full stack",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="antialiased bg-background text-foreground">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider>
              <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                  {/* Mobile header — hidden on desktop where the sidebar is always visible */}
                  <header className="flex items-center gap-2 border-b border-border p-4 md:hidden">
                    <SidebarTrigger />
                    <span className="text-lg font-bold tracking-tight text-orange-500">
                      ShopFusion
                    </span>
                  </header>
                  <main className="flex flex-1 flex-col gap-4 p-4">
                    {children}
                  </main>
                </SidebarInset>
              </SidebarProvider>
              <Toaster position="top-right" />
            </TooltipProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
