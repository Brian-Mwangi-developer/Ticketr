"use client";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { CalendarDays, Plus, Ticket } from "lucide-react";
import Link from "next/link";
import Spinner from "./Spinner";
import SellerEventList from "./SellerEventList";

export default function SellerDashboard() {
  const { user } = useUser();
  const events = useQuery(
    api.events.getSellerEvents,
    user?.id ? { userId: user.id } : "skip"
  );

  if (events === undefined) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8 text-white">
          <h2 className="text-2xl font-bold">Seller Dashboard</h2>
          <p className="text-blue-100 mt-2">
            Create and manage your events
          </p>
        </div>

        {/* Quick Actions */}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Your Events
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                {events.length === 0
                  ? "You haven't created any events yet"
                  : `You have ${events.length} event${events.length !== 1 ? "s" : ""}`}
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/seller/new-event"
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Create Event
              </Link>
              <Link
                href="/seller/events"
                className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                <CalendarDays className="w-5 h-5" />
                View All Events
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <SellerEventList />
      </div>
    </div>
  );
}