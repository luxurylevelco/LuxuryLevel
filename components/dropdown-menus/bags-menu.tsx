"use client";

import { Brand } from "@/lib/types";
import { Poppins } from "next/font/google";
import { useRouter } from "next/navigation";

// Load Poppins font with a CSS variable
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function BagsMenu({
  toggleMobileNav,
  brands,
}: {
  toggleMobileNav?: () => void;
  brands: Brand[];
}) {
  const router = useRouter();

  const redirect = (brand: Brand) => {
    if (toggleMobileNav) {
      toggleMobileNav();
    }

    router.push(`/bags?brand=${brand.id}`);
  };

  return (
    <div
      className={`grid  grid-cols-1 lg:grid-cols-1 gap-4 ${poppins.className} p-4 bg-white`}
    >
      {brands.map((brand) => {
        if (!brand.name) return null;

        return (
          <button
            key={brand.id}
            onClick={() => redirect(brand)}
            className={`font-normal pr-4  text-start 
             border-r-[1px] border-gray-300 lg:text-[12px] xl:text-[14px] `}
          >
            {brand.name}
          </button>
        );
      })}
    </div>
  );
}
