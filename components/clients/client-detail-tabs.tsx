"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type ClientDetailTabsProps = {
  clientId: string;
};

export function ClientDetailTabs({ clientId }: ClientDetailTabsProps) {
  const pathname = usePathname();

  const tabs = [
    {
      name: "Notes",
      href: `/clients/${clientId}/notes`,
      isActive: (path: string) =>
        path.includes("/notes") || path === `/clients/${clientId}`,
    },
    {
      name: "Profile",
      href: `/clients/${clientId}`,
      isActive: (path: string) =>
        path === `/clients/${clientId}` && !path.includes("/notes"),
    },
  ];

  return (
    <div className="border-b">
      <nav aria-label="Tabs" className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <Link
            aria-current={tab.isActive(pathname) ? "page" : undefined}
            className={cn(
              tab.isActive(pathname)
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:border-gray-300 hover:text-gray-700",
              "whitespace-nowrap border-b-2 px-1 py-4 font-medium text-sm"
            )}
            href={tab.href}
            key={tab.name}
          >
            {tab.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}
