"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

interface SearchProps {
  className?: string;
  toggleMobileNav?: () => void;
  searchParamKey: string;
  placeholder: string;
  providedPath?: string;
  resetOnSearch?: boolean;
}

export default function Search({
  className = "",
  toggleMobileNav,
  searchParamKey,
  placeholder,
  providedPath,
  resetOnSearch = false,
}: SearchProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const searchValue = searchParams.get(searchParamKey) ?? "";
  const [query, setQuery] = useState(searchValue);

  const currentPath = providedPath || pathname;

  const updateSearchParams = useCallback(
    (newQuery: string | null) => {
      const params = resetOnSearch
        ? new URLSearchParams()
        : new URLSearchParams(searchParams);

      if (newQuery?.trim()) {
        params.set(searchParamKey, newQuery.trim());
      } else {
        params.delete(searchParamKey);
      }

      const paramStr = params.toString();
      router.replace(`${currentPath}${paramStr ? `?${paramStr}` : ""}`);
    },
    [currentPath, resetOnSearch, router, searchParamKey, searchParams]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const trimmed = query.trim();
      if (!trimmed) return;
      toggleMobileNav?.();
      updateSearchParams(trimmed);
    },
    [query, toggleMobileNav, updateSearchParams]
  );

  const handleClear = useCallback(() => {
    setQuery("");
    updateSearchParams(null);
  }, [updateSearchParams]);

  const showClearButton = useMemo(() => !!searchValue, [searchValue]);

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex h-10 w-full items-center gap-2 rounded-full border border-gray-300 px-4 ${className}`}
    >
      <Image src="/svgs/search-icon.svg" alt="Search" width={16} height={16} />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full bg-transparent text-sm focus:outline-none"
        placeholder={placeholder}
        aria-label="Search"
      />
      {showClearButton && (
        <button
          type="button"
          onClick={handleClear}
          className="p-1 hover:opacity-80"
          aria-label="Clear search"
        >
          <Image src="/svgs/x-icon.svg" alt="Clear" width={20} height={20} />
        </button>
      )}
      <button
        type="submit"
        className="p-1 hover:opacity-80"
        aria-label="Submit search"
      >
        <Image
          src="/svgs/arrow-right-search-submit.svg"
          alt="Submit"
          width={24}
          height={24}
        />
      </button>
    </form>
  );
}
