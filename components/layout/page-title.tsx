"use client";

/**
 * Page Title Component
 *
 * Displays dynamic page title based on current route.
 * Shows back button for detail/edit/create pages.
 * Used in simplified header for initial deployment.
 */

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

const NOTE_ROUTE_REGEX = /\/clients\/[^/]+\/notes\/[^/]+$/;

export function PageTitle() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Routing logic requires checking multiple paths
  const getPageInfo = (): { title: string; backHref?: string } => {
    // Client routes - Specific first
    if (pathname.startsWith("/clients/") && pathname.includes("/notes/")) {
      const clientId = pathname.split("/")[2];
      if (pathname.endsWith("/edit")) {
        return { title: "Edit Session Note", backHref: `/clients/${clientId}` };
      }
      if (pathname.match(NOTE_ROUTE_REGEX)) {
        return { title: "Session Note", backHref: `/clients/${clientId}` };
      }
      return { title: "Client Notes", backHref: `/clients/${clientId}` };
    }

    if (pathname.startsWith("/clients/") && pathname.endsWith("/edit")) {
      const clientId = pathname.split("/")[2];
      return { title: "Edit Client", backHref: `/clients/${clientId}` };
    }

    if (pathname === "/clients") {
      return { title: "Clients" };
    }
    if (pathname === "/clients/new") {
      return { title: "New Client", backHref: "/clients" };
    }
    if (pathname.startsWith("/clients/")) {
      return { title: "Client Profile", backHref: "/clients" };
    }

    // Note routes
    if (pathname === "/notes/new") {
      const clientId = searchParams.get("clientId");
      return {
        title: "New Session Note",
        backHref: clientId ? `/clients/${clientId}` : "/clients",
      };
    }

    return { title: "Notable" };
  };

  const { title, backHref } = getPageInfo();

  return (
    <div className="flex items-center gap-4">
      {backHref && (
        <Button asChild size="icon" variant="ghost">
          <Link href={backHref}>
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
      )}
      <h1 className="font-bold text-2xl tracking-tight">{title}</h1>
    </div>
  );
}
