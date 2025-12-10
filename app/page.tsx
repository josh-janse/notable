/**
 * Home Page
 *
 * Redirects to the clients page as the main dashboard.
 */

import { redirect } from "next/navigation";

export default function HomePage(): never {
  redirect("/clients");
}
