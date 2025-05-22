"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

export default function Search({
  className,
  toggleMobileNav,
  searchParamKey,
  placeholder,
  pathname,
}: {
  className?: string;
  toggleMobileNav?: () => void;
  searchParamKey: string;
  placeholder: string;
  pathname: string;
}) {
  const [query, setQuery] = useState<string>("");
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!query.trim()) return;

    if (toggleMobileNav) {
      toggleMobileNav();
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set(searchParamKey, query.trim());

    router.push(`/${pathname}?${params.toString()}`);
  };

  const handleClear = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(searchParamKey);
    router.push(`/${pathname}?${params.toString()}`);
    setQuery(""); // Optional: clear local input
  };

  const value = searchParams.get(searchParamKey) ?? "";

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex items-center w-full h-[40px] rounded-full border border-gray-300 px-4 gap-2 ${className}`}
    >
      {/* Left Icon */}
      <Image
        src="/svgs/search-icon.svg"
        alt="search icon"
        width={16}
        height={16}
      />

      {/* Input */}
      <input
        type="text"
        value={query || value}
        onChange={(e) => setQuery(e.currentTarget.value)}
        className="w-full bg-transparent focus:outline-none text-sm"
        placeholder={placeholder}
      />

      {/* Clear Button */}
      {searchParams.get(searchParamKey) && (
        <button
          type="button"
          onClick={handleClear}
          className="p-1 hover:opacity-80"
        >
          <Image
            src="/svgs/x-icon.svg"
            alt="clear search"
            width={20}
            height={20}
          />
        </button>
      )}

      {/* Right Submit Button */}
      <button type="submit" className="p-1 hover:opacity-80">
        <Image
          src="/svgs/arrow-right-search-submit.svg"
          alt="submit search"
          width={24}
          height={24}
        />
      </button>
    </form>
  );
}
