import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import {Id} from "@/convex/_generated/dataModel";
import {useQuery} from "convex/react";
import {api} from "@/convex/_generated/api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Check if an event is past. An event is only "past" when the current date
 * is strictly AFTER the event day. On the day of the event, it is still live.
 */
export function isEventPast(eventDate: number): boolean {
  const event = new Date(eventDate);
  const now = new Date();
  const eventDay = new Date(event.getFullYear(), event.getMonth(), event.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return eventDay.getTime() < today.getTime();
}


export  function useStorageUrl(storageId:Id<"_storage"> | undefined){
  return useQuery(api.storage.getUrl,storageId ?{storageId}:"skip")
}