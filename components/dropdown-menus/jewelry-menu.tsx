"use client";

import { Category } from "@/lib/types";
import { toSentenceCase } from "@/lib/utils";
import { Poppins } from "next/font/google";
import { useRouter } from "next/navigation";

// Load Poppins font with a CSS variable
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function JewelryCategoriesMenu({
  toggleMobileNav,
  categories,
}: {
  toggleMobileNav?: () => void;
  categories: Category[];
}) {
  const router = useRouter();

  const redirect = (category: Category) => {
    if (toggleMobileNav) {
      toggleMobileNav();
    }

    router.push(`/jewelry?sub_category=${toSentenceCase(category.name)}`);
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
