"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Search({
  className,
  toggleMobileNav,
}: {
  className?: string;
  toggleMobileNav?: () => void;
}) {
  const [query, setQuery] = useState<string>("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (toggleMobileNav) {
      toggleMobileNav();
    }

    router.push(`/all-products?query=${encodeURIComponent(query)}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex items-center w-full h-[40px] rounded-full border border-gray-300 px-4 gap-2 ${className} `}
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
        value={query}
        onChange={(e) => setQuery(e.currentTarget.value)}
        className="w-full bg-transparent focus:outline-none text-sm"
        placeholder="Search for products..."
      />

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
