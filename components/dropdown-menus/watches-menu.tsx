"use client";

import { Poppins } from "next/font/google";
import Link from "next/link";
// Load Poppins font with a CSS variable
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function WatchesMenu() {
  const items = ["Male", "Female", "Unisex"];

  const columns = 3;

  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-3 gap-4 ${poppins.className} p-4 `}
    >
      {items.map((item, index) => {
        const isLastColumn = (index + 1) % columns === 0;

        return (
          <Link
            key={item}
            href={`/watches?gender=${item}`}
            className={`font-normal pr-4 text-[14px] ${
              !isLastColumn ? "border-r-[1px] border-gray-300" : ""
            }`}
          >
            {item.toUpperCase()}
          </Link>
        );
      })}
    </div>
  );
}
