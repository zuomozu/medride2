"use client";
import AppLayout from "@/layouts/AppLayout";
import BookRide from "@/Pages/BookRide";

export default function Page() {
  return (
    <AppLayout currentPageName="BookRide">
      <div className="p-6">
        <BookRide />
      </div>
    </AppLayout>
  );
}
