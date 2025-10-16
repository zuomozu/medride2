"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createPageUrl } from "@/utils";
import {
  Calendar, MapPin, CreditCard, Settings, HelpCircle, Car, Users,
  BarChart3, Phone, LogOut, User as UserIcon
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
  SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";

const PublicHeader = ({ onLogin }) => (
  <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-sm">
    <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg">
          <Car className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-gray-900 text-lg">MedRide</h2>
          <p className="text-xs text-gray-500 font-medium">Medical Transportation</p>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-end space-x-4">
        <Button onClick={onLogin} className="bg-green-600 hover:bg-green-700">
          Sign In / Sign Up
        </Button>
      </div>
    </div>
  </header>
);

export default function AppLayout({ children, currentPageName }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);

        // read role from query ?role=
        const urlParams = new URLSearchParams(window.location.search);
        const role = urlParams.get("role");
        if (role && role !== currentUser.role) {
          await User.updateMyUserData({ role });
          setUser(prev => ({ ...prev, role }));
        }

        // role-based redirects (use router.push)
        if (currentUser.role === "admin" && currentPageName === "BookRide") {
          router.push(createPageUrl("AdminBookings"));
        } else if (currentUser.role === "driver" && currentPageName === "BookRide") {
          router.push(createPageUrl("DriverDashboard"));
        } else if (
          currentUser.role === "user" &&
          ["AdminBookings", "ManageDrivers", "Analytics", "AdminSupport", "DriverDashboard"].includes(currentPageName)
        ) {
          router.push(createPageUrl("BookRide"));
        }
      } catch {
        // not logged in
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [currentPageName, router]);

  const handleLoginRedirect = async () => {
    try {
      const redirectUrl = window.location.origin + createPageUrl("BookRide");
      await User.loginWithRedirect(redirectUrl);
    } catch (e) { console.error(e); }
  };

  const handleLogout = async () => {
    try { await User.logout(); window.location.reload(); } catch (e) { console.error(e); }
  };

  const riderNavItems = [
    { title: "Book a Ride", url: createPageUrl("BookRide"), icon: Car },
    { title: "My Bookings", url: createPageUrl("MyBookings"), icon: Calendar },
    { title: "Payment Methods", url: createPageUrl("PaymentMethods"), icon: CreditCard },
    { title: "Become a Driver", url: createPageUrl("DriverProfile"), icon: Car },
    { title: "Support", url: createPageUrl("Support"), icon: HelpCircle },
  ];
  const adminNavItems = [
    { title: "All Bookings", url: createPageUrl("AdminBookings"), icon: Calendar },
    { title: "Manage Drivers", url: createPageUrl("ManageDrivers"), icon: Users },
    { title: "Analytics", url: createPageUrl("Analytics"), icon: BarChart3 },
    { title: "Support Requests", url: createPageUrl("AdminSupport"), icon: HelpCircle },
  ];
  const driverNavItems = [
    { title: "Driver Dashboard", url: createPageUrl("DriverDashboard"), icon: Car },
    { title: "My Profile", url: createPageUrl("DriverProfile"), icon: UserIcon },
    { title: "Support", url: createPageUrl("Support"), icon: HelpCircle },
  ];
  const navigationItems = user?.role === "admin" ? adminNavItems : user?.role === "driver" ? driverNavItems : riderNavItems;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    if (currentPageName === "BookRide") {
      return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
          <PublicHeader onLogin={handleLoginRedirect} />
          <main>{children}</main>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
        {/* trimmed for brevity; keep your role chooser here */}
        <Button onClick={handleLoginRedirect} className="bg-green-600 hover:bg-green-700">
          Sign In 
        </Button>
      </div>
    );
  }

  return (
    <SidebarProvider className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      <Sidebar className="border-r border-gray-100 bg-white/80 backdrop-blur-sm">
        <SidebarHeader className="border-b border-gray-100 p-6">
  <div className="flex items-center">
    <img
      src="/AMEDS logo 3x0_46.png"
      alt="AroundMeds Logo"
      className="h-10 object-contain"
    />
  </div>
</SidebarHeader>


        <SidebarContent className="p-4">
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
              {user?.role === "admin" ? "Admin Panel" : user?.role === "driver" ? "Driver Portal" : "Transportation"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {navigationItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild
                      className={`hover:bg-green-50 hover:text-green-700 rounded-xl mb-1 ${
                        pathname === item.url ? "bg-green-50 text-green-700 shadow-sm" : "text-gray-600"
                      }`}>
                      <Link href={item.url} className="flex items-center gap-3 px-4 py-3">
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-gray-100 p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg">
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </SidebarFooter>
      </Sidebar>

      <main className="flex-1">
        <div className="lg:hidden p-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
          <SidebarTrigger className="text-gray-600" />
        </div>
        {children}
      </main>
    </SidebarProvider>
  );
}
