"use client";

import { Category } from "@/lib/types";
import { Poppins } from "next/font/google";
import Link from "next/link";
import { useEffect, useState } from "react";

// Load Poppins font with a CSS variable
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function JewelryCategoriesMenu() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchBrands = async () => {
      const res = await fetch(`/api/categories/jewelry`, {
        method: "GET",
        cache: "force-cache",
      });
      const categories = await res.json();

      setCategories(categories);
    };

    fetchBrands();
  }, []);

  const columns = 4;

  return (
    <div
      className={`grid  grid-cols-1 lg:grid-cols-4 gap-4 ${poppins.className} p-4 `}
    >
      {categories.map((category, index) => {
        const isLastColumn = (index + 1) % columns === 0;

        if (!category.name) return null;

        return (
          <Link
            key={category.id}
            href={`/jewelry?category=${category.id}`}
            className={`font-normal pr-4 text-[14px] ${
              !isLastColumn ? "border-r-[1px] border-gray-300" : ""
            }`}
          >
            {category.name}
          </Link>
        );
      })}
    </div>
  );
}
