"use client";

import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import {
  CalendarDays,
  Edit,
  MapPin,
  Plus,
  Ticket,
  ImageIcon,
  BarChart3,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useStorageUrl, isEventPast } from "@/lib/utils";
import Spinner from "./Spinner";
import { Id } from "@/convex/_generated/dataModel";

function SellerEventImage({
  imageStorageId,
  imageUrl,
  name,
}: {
  imageStorageId?: Id<"_storage">;
  imageUrl?: string;
  name: string;
}) {
  const convexUrl = useStorageUrl(imageStorageId);
  const displayUrl = imageUrl || convexUrl;

  if (!displayUrl) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <ImageIcon className="w-8 h-8 text-gray-300" />
      </div>
    );
  }

  return (
    <Image
      src={displayUrl}
      alt={name}
      fill
      className="object-cover"
    />
  );
}

export default function SellerEventList() {
  const { user } = useUser();
  const events = useQuery(
    api.events.getSellerEvents,
    user?.id ? { userId: user.id } : "skip"
  );

  if (events === undefined) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No events yet
        </h3>
        <p className="text-gray-500 mb-6">
          Create your first event to start selling tickets
        </p>
        <Link
          href="/seller/new-event"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Event
        </Link>
      </div>
    );
  }

  const upcomingEvents = events.filter((e) => !isEventPast(e.eventDate));
  const pastEvents = events.filter((e) => isEventPast(e.eventDate));

  return (
    <div className="space-y-8">
      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Upcoming Events ({upcomingEvents.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingEvents.map((event) => (
              <Link
                key={event._id}
                href={`/event/${event._id}`}
                className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all"
              >
                {/* Image */}
                <div className="relative w-full h-40">
                  <SellerEventImage
                    imageStorageId={event.imageStorageId}
                    imageUrl={event.imageUrl}
                    name={event.name}
                  />
                </div>

                {/* Details */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {event.name}
                    </h4>
                    <span className="text-sm font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full shrink-0 ml-2">
                      £{event.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span>
                        {new Date(event.eventDate).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Ticket className="w-3.5 h-3.5" />
                      <span>{event.totalTickets} tickets</span>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Link
                    
                      href={`/seller/events/${event._id}/event`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </Link>
                    <Link
                      href={`/seller/events/${event._id}/metrics`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      <BarChart3 className="w-3 h-3" />
                      Metrics
                    </Link>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-500 mb-4">
            Past Events ({pastEvents.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pastEvents.map((event) => (
              <Link
                key={event._id}
                href={`/event/${event._id}`}
                className="group bg-white border border-gray-200 rounded-xl overflow-hidden opacity-70 hover:opacity-100 hover:shadow-md transition-all"
              >
                <div className="relative w-full h-32">
                  <SellerEventImage
                    imageStorageId={event.imageStorageId}
                    imageUrl={event.imageUrl}
                    name={event.name}
                  />
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-gray-700 line-clamp-1">
                    {event.name}
                  </h4>
                  <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-400">
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>
                      {new Date(event.eventDate).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                      Ended
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
