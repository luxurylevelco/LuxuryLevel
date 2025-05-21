"use client";

import { Brand } from "@/lib/types";
import { Poppins } from "next/font/google";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Load Poppins font with a CSS variable
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function BagsMenu({
  toggleMobileNav,
}: {
  toggleMobileNav?: () => void;
}) {
  const [brands, setbrands] = useState<Brand[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchBrands = async () => {
      const res = await fetch(`/api/brands/bag-brands`, {
        method: "GET",
      });
      const brands: Brand[] = await res.json();

      setbrands(brands);
    };

    fetchBrands();
  }, []);

  const redirect = (id: Brand["id"]) => {
    if (toggleMobileNav) {
      toggleMobileNav();
    }
    router.push(`/bags?brands=${id}`);
  };

  return (
    <div
      className={`grid  grid-cols-1 lg:grid-cols-1 gap-4 ${poppins.className} p-4 `}
    >
      {brands.map((brand) => {
        if (!brand.name) return null;

        return (
          <button
            key={brand.id}
            onClick={() => redirect(brand.id)}
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
