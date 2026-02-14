import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import EventForm from "@/components/EventForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewEventPage() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Link
                href="/seller"
                className="text-white/80 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h2 className="text-2xl font-bold">Create New Event</h2>
            </div>
            <p className="text-blue-100 mt-1 ml-8">
              Fill in the details below to create your event
            </p>
          </div>

          {/* Form */}
          <div className="p-6">
            <EventForm mode="create" />
          </div>
        </div>
      </div>
    </div>
  );
}
