"use client";

import { GateQueueStatus, GateSelector, VerifiedBadge } from "@/components/GateQueue";
import Spinner from "@/components/Spinner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { GATE_QUEUE_STATUS } from "@/convex/constants";
import { useQuery } from "convex/react";
import { Clock, OctagonXIcon } from "lucide-react";

function JoinQueue({
  eventId,
  userId,
}: {
  eventId: Id<"events">;
  userId: string;
}) {
  const userGateEntry = useQuery(api.gateQueue.getUserGateEntry, {
    eventId,
    userId,
  });
  const event = useQuery(api.events.getById, { eventId });

  const isEventOwner = userId === event?.userId;

  if (userGateEntry === undefined || !event) {
    return <Spinner />;
  }

  const isPastEvent = event.eventDate < Date.now();

  // Check if user has a verified entry (check all entries, not just active)
  const isVerified = userGateEntry?.status === GATE_QUEUE_STATUS.VERIFIED;

  // User has an active gate queue entry (pending or current)
  const hasActiveEntry =
    userGateEntry &&
    (userGateEntry.status === GATE_QUEUE_STATUS.PENDING ||
      userGateEntry.status === GATE_QUEUE_STATUS.CURRENT);

  return (
    <div className="w-full">
      {/* Event owner block */}
      {isEventOwner ? (
        <div className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-lg">
          <OctagonXIcon className="w-5 h-5" />
          <span>You cannot join the queue for your own event</span>
        </div>
      ) : isPastEvent ? (
        <div className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed">
          <Clock className="w-5 h-5" />
          <span>Event has ended</span>
        </div>
      ) : isVerified ? (
        <VerifiedBadge gateName={userGateEntry.gateName} />
      ) : hasActiveEntry ? (
        <GateQueueStatus eventId={eventId} userId={userId} />
      ) : (
        <GateSelector eventId={eventId} userId={userId} />
      )}
    </div>
  );
}

export default JoinQueue;
