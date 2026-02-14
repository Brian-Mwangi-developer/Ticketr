"use client"
import GateTrafficIndicator from "@/components/GateTrafficIndicator";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useStorageUrl, isEventPast } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import {
  CalendarDays,
  LoaderCircle,
  MapPin,
  PencilIcon,
  ShieldCheck,
  StarIcon,
  Ticket,
  XCircle
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";


function EventCard({ eventId }: { eventId: Id<"events"> }) {
  const { user } = useUser();
  const router = useRouter()
  const event = useQuery(api.events.getById, { eventId });
  const availability = useQuery(api.events.getEventAvailability, { eventId });

  const userGateEntry = useQuery(api.gateQueue.getUserGateEntry, {
    eventId,
    userId: user?.id ?? ""
  })
  const gateTraffic = useQuery(api.gateQueue.getGateTraffic, { eventId })

  const imageUrl = useStorageUrl(event?.imageStorageId)
  // Use Vercel Blob imageUrl if available, otherwise fall back to Convex storage
  const displayImageUrl = event?.imageUrl || imageUrl;

  if (!event || !availability) return null
  const isPastEvent = isEventPast(event.eventDate);
  const isEventOwner = user?.id === event?.userId;

  const renderQueuePosition = () => {
    if (!userGateEntry) return null;

    if (userGateEntry.status === "verified") {
      return (
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center">
            <ShieldCheck className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-green-700 font-medium">Verified at {userGateEntry.gateName}</span>
          </div>
        </div>
      );
    }

    if (userGateEntry.status === "current") {
      return (
        <div className="flex flex-col lg:flex-row items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center">
            <div className="relative mr-2">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping absolute" />
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full relative" />
            </div>
            <span className="text-red-700 font-medium">
              You&apos;re up at {userGateEntry.gateName}!
            </span>
          </div>
          <div className="flex items-center">
            <LoaderCircle className="w-4 h-4 mr-1 animate-spin text-red-500" />
            <span className="text-red-600 text-sm">Verify now</span>
          </div>
        </div>
      );
    }

    if (userGateEntry.status === "pending") {
      return (
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center">
            <LoaderCircle className="w-4 h-4 mr-2 animate-spin text-blue-500" />
            <span className="text-blue-700">
              {userGateEntry.peopleAhead === 0
                ? "You're next!"
                : `${userGateEntry.peopleAhead} ahead`}
            </span>
          </div>
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium text-sm">
            {userGateEntry.gateName} • #{userGateEntry.position}
          </span>
        </div>
      );
    }

    return null;
  }

  const renderTicketStatus = () => {
    if (!user) return null
    if (isEventOwner) {
      return (
        <div className="mt-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/seller/events/${eventId}/edit`);
            }}
            className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200 shadow-sm flex items-center justify-center gap-2"
          >
            <PencilIcon className="w-5 h-5" />
            Edit Event
          </button>
        </div>
      );
    }
    if (userGateEntry) {
      if (userGateEntry.status === "verified") {
        return (
          <div className="mt-4 flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
            <div className="flex items-center">
              <ShieldCheck className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-green-700 font-medium">
                Verified at {userGateEntry.gateName}
              </span>
            </div>
          </div>
        );
      }
      return (
        <div className="mt-4">
          {renderQueuePosition()}
          {(userGateEntry.status === "expired" || userGateEntry.status === "released") && (
            <div className="p-3 bg-red-50 rounded-lg border border-red-100">
              <span className="text-red-700 font-medium flex items-center">
                <XCircle className="w-5 h-5 mr-2" />
                {userGateEntry.status === "expired" ? "Queue spot expired" : "Spot released"}
              </span>
            </div>
          )}
        </div>
      );
    }
    return null
  }
  return (
    <div
      onClick={() => router.push(`/event/${eventId}`)}
      className={`bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 cursor-pointer overflow-hidden relative ${isPastEvent ? "opacity-75 hover:opacity-100" : ""
        }`}
    >
      {/*  Event Image*/}
      {displayImageUrl && (
        <div className="relative w-full h-48">
          <Image
            src={displayImageUrl}
            alt={event.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}
      {/*Event Details*/}
      <div className={`p-6 ${displayImageUrl ? "relative" : ""}`}>
        <div className="flex justify-between items-start">
          {/*Event Name and Owner Badge*/}
          <div>
            <div className="flex flex-col items-start gap-2">
              {isEventOwner && (
                <span className="inline-flex items-center gap-1 bg-blue-600/90 text-white px-2 py-1 rounded-full text-xs font-medium">
                  <StarIcon className="w-3 h-3" />
                  Your Event
                </span>
              )}
              <h2 className="text-2xl font-bold text-gray-900">{event.name}</h2>
            </div>
            {isPastEvent && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mt-2">
                Past Event
              </span>
            )}
          </div>
        </div>
        {/*  Price Tag*/}
        <div className="flex flex-col items-end gap-2 ml-4">
          <span
            className={`px-4 py-1.5 font-semibold rounded-full ${isPastEvent
                ? "bg-gray-50 text-gray-500"
                : "bg-green-50 text-green-700"
              }`}
          >
            £{event.price.toFixed(2)}
          </span>
          {availability.purchasedCount >= availability.totalTickets && (
            <span className="px-4 py-1.5 bg-red-50 text-red-700 font-semibold rounded-full text-sm">
              Sold Out
            </span>
          )}
        </div>
        {/*  Event Details*/}
        <div className="mt-4 space-y-3">
          <div className="flex items-center text-gray-600">
            <MapPin className="w-4 h-4 mr-2" />
            <span>{event.location}</span>
          </div>
          {/*  Calendar days */}
          <div className="flex items-center text-gray-600">
            <CalendarDays className="w-4 h-4 mr-2" />
            <span>
              {new Date(event.eventDate).toLocaleDateString()}{" "}
              {isPastEvent && "(Ended)"}
            </span>
          </div>
          {/*  Ticket*/}
          <div className="flex items-center text-gray-600">
            <Ticket className="w-4 h-4 mr-2" />
            <span>
              {availability.totalTickets - availability.purchasedCount} /{" "}
              {availability.totalTickets} available
            </span>
          </div>
          {/*  Gate Traffic — only show on event day */}
          {!isPastEvent && gateTraffic && (() => {
            const eventDay = new Date(event.eventDate).toDateString();
            const today = new Date().toDateString();
            return eventDay === today;
          })() && (
            <div className="mt-1">
              <GateTrafficIndicator eventId={eventId} />
            </div>
          )}
        </div>
        <p className="mt-4 text-gray-600 text-sm line-clamp-2">
          {event.description}
        </p>

        <div onClick={(e) => e.stopPropagation()}>
          {!isPastEvent && renderTicketStatus()}
        </div>
      </div>
    </div>
  )
}

export default EventCard
