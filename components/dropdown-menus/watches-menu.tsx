"use client";

import { Poppins } from "next/font/google";
import { useRouter } from "next/navigation";
// Load Poppins font with a CSS variable
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function WatchesMenu({
  toggleMobileNav,
}: {
  toggleMobileNav?: () => void;
}) {
  const items = ["Male", "Female", "Unisex"];
  const router = useRouter();

  const redirect = (gender: string) => {
    if (toggleMobileNav) {
      toggleMobileNav();
    }
    router.push(`/watches?gender=${gender}`);
  };

  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-3 gap-4 ${poppins.className} p-4 `}
    >
      {items.map((gender) => {
        return (
          <button
            key={gender}
            onClick={() => redirect(gender)}
            className={`font-normal pr-4  text-start 
              border-r-[1px] border-gray-300 lg:text-[12px] xl:text-[14px] `}
          >
            {gender.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
