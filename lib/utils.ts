import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(firstName: string, lastName: string): string {
  const first = firstName?.trim()[0]?.toUpperCase() || "";
  const last = lastName?.trim()[0]?.toUpperCase() || "";
  return first + last || "U";
}
