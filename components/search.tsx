"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

interface SearchProps {
  className?: string;
  toggleMobileNav?: () => void;
  searchParamKey: string;
  placeholder: string;
  pathname: string;
  resetOnSearch?: boolean;
}

export default function Search({
  className = "",
  toggleMobileNav,
  searchParamKey,
  placeholder,
  pathname,
  resetOnSearch = false,
}: SearchProps) {
  const [query, setQuery] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchValue = searchParams.get(searchParamKey) ?? "";

  const updateSearchParams = useCallback(
    (newQuery: string | null) => {
      const params = resetOnSearch
        ? new URLSearchParams() // Clear all if resetOnSearch is true
        : new URLSearchParams(searchParams);

      if (newQuery?.trim()) {
        params.set(searchParamKey, newQuery.trim());
      } else {
        params.delete(searchParamKey);
      }

      router.push(`/${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams, searchParamKey, resetOnSearch]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!query.trim()) return;
      toggleMobileNav?.();
      updateSearchParams(query);
    },
    [query, toggleMobileNav, updateSearchParams]
  );

  const handleClear = useCallback(() => {
    setQuery("");
    updateSearchParams(null);
  }, [updateSearchParams]);

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex h-10 w-full items-center gap-2 rounded-full border border-gray-300 px-4 ${className}`}
    >
      <Image src="/svgs/search-icon.svg" alt="Search" width={16} height={16} />
      <input
        type="text"
        value={query || searchValue}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full bg-transparent text-sm focus:outline-none"
        placeholder={placeholder}
        aria-label="Search"
      />
      {searchValue && (
        <button
          type="button"
          onClick={handleClear}
          className="p-1 hover:opacity-80"
          aria-label="Clear search"
        >
          <Image src="/svgs/x-icon.svg" alt="" width={20} height={20} />
        </button>
      )}
      <button
        type="submit"
        className="p-1 hover:opacity-80"
        aria-label="Submit search"
      >
        <Image
          src="/svgs/arrow-right-search-submit.svg"
          alt=""
          width={24}
          height={24}
        />
      </button>
    </form>
  );
}
