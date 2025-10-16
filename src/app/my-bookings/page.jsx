"use client"
import AppLayout from "@/layouts/AppLayout"
import MyBookings from "@/Pages/MyBookings"
import ActiveBookingCard from "@/components/ActiveBookingCard";
import ActiveBookingList from "@/components/ActiveBookingList";
import { useActiveBooking } from "@/hooks/useActiveBooking";

export default function Page() {
   const activeBooking = useActiveBooking();

  return (
    <AppLayout currentPageName="MyBookings">
      <div className="p-6">
        {activeBooking && <ActiveBookingList />}
        <MyBookings />
      </div>
    </AppLayout>
  )
}
