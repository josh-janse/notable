"use client";

/**
 * Client Search Client Component
 *
 * Global client search with debounced input.
 * Updates URL search params for server-side filtering.
 */

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

type ClientSearchProps = {
  defaultValue?: string;
  placeholder?: string;
};

export function ClientSearch({
  defaultValue = "",
  placeholder = "Search clients by name...",
}: ClientSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(defaultValue);

  // Debounce search input
  const searchParamsString = searchParams.toString();
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      const params = new URLSearchParams(searchParamsString);
      const currentSearch = params.get("search") || "";

      if (searchTerm === currentSearch) {
        return;
      }

      if (searchTerm) {
        params.set("search", searchTerm);
        params.set("page", "1"); // Reset to first page on new search
      } else {
        params.delete("search");
      }

      // Update URL with search params
      const queryString = params.toString();
      const url = queryString ? `${pathname}?${queryString}` : pathname;
      router.push(url);
    }, 300); // 300ms debounce

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, pathname, router, searchParamsString]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    },
    []
  );

  const handleClear = useCallback(() => {
    setSearchTerm("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    const queryString = params.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;
    router.push(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams, router]);

  return (
    <div className="relative">
      <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
      <Input
        aria-label="Search clients"
        className="pr-4 pl-9"
        onChange={handleSearchChange}
        placeholder={placeholder}
        type="search"
        value={searchTerm}
      />
      {searchTerm && (
        <button
          aria-label="Clear search"
          className="-translate-y-1/2 absolute top-1/2 right-3 text-muted-foreground hover:text-foreground"
          onClick={handleClear}
          type="button"
        >
          ×
        </button>
      )}
    </div>
  );
}
