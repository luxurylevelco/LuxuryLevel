"use client";

import { Category } from "@/lib/types";
import { Poppins } from "next/font/google";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Load Poppins font with a CSS variable
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function JewelryCategoriesMenu({
  toggleMobileNav,
}: {
  toggleMobileNav?: () => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchBrands = async () => {
      const res = await fetch(`/api/categories/jewelry/sub-categories`, {
        method: "GET",
      });
      const categories = await res.json();

      setCategories(categories);
    };

    fetchBrands();
  }, []);

  const redirect = (category: Category) => {
    if (toggleMobileNav) {
      toggleMobileNav();
    }

    router.push(`/jewelry?sub_category=${category.name}`);
  };

  return (
    <div
      className={`grid  grid-cols-1 lg:grid-cols-4 gap-4 ${poppins.className} p-4 bg-white`}
    >
      {categories.map((category) => {
        if (!category.name) return null;

        return (
          <button
            key={category.id}
            onClick={() => redirect(category)}
            className={`font-normal pr-4  text-start 
              border-r-[1px] border-gray-300 lg:text-[12px] xl:text-[14px] `}
          >
            {category.name}
          </button>
        );
      })}
    </div>
  );
}
