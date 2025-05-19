"use client";

import { JSX, useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { Roboto_Condensed } from "next/font/google";

const robotoCondensed = Roboto_Condensed({
  subsets: ["latin"],
  weight: ["400", "700"],
});

function Logo() {
  return (
    <div>
      <Image
        src={"/svgs/level-logo.svg"}
        alt={"search icon"}
        className="object-contain "
        width={50}
        height={1000}
      />
    </div>
  );
}

type menuMapProps = {
  title: string;
  link: string;
  hasDropdown: boolean;
  element: JSX.Element;
};

function Menu() {
  const menuMap: menuMapProps[] = [
    {
      title: "HOME",
      link: "/",
      hasDropdown: false,
      element: <div>test</div>,
    },
    {
      title: "OUR BRANDS",
      link: "/brands",
      hasDropdown: true,
      element: <div>test</div>,
    },
    {
      title: "WATCHES",
      link: "/watches",
      hasDropdown: true,
      element: <div>test</div>,
    },
    {
      title: "JEWELRY",
      link: "/jewelry",
      hasDropdown: true,
      element: <div>test</div>,
    },
    {
      title: "BAGS",
      link: "/bags",
      hasDropdown: true,
      element: <div>test</div>,
    },
  ];

  function Item(item: menuMapProps) {
    const [isOpen, setisOpen] = useState<boolean>(false);
    return (
      <div
        className="relative "
        onMouseEnter={() => setisOpen(true)}
        onMouseLeave={() => setisOpen(false)}
      >
        {/* Trigger Link */}
        <Link href={item.link} className="flex gap-2 items-center">
          {item.title}
          {item.hasDropdown && (
            <Image
              src="/svgs/arrow-down.svg"
              alt="arrow"
              width={10}
              height={10}
              className={`${
                isOpen ? "-rotate-180" : "rotate-0"
              } transition-all duration-300`}
            />
          )}
        </Link>

        {/* Dropdown */}
        {item.hasDropdown && (
          <div
            className={`absolute top-4 left-1/2 -translate-x-1/2 mt-2 w-max z-50
              transition-all duration-300 ease-out
              ${
                isOpen
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-2 pointer-events-none"
              }
            `}
          >
            {/* Arrow */}
            <div className="flex justify-center w-full h-[20px]"></div>

            {/* Dropdown content */}
            <div
              className="card-style"
              style={{ backgroundColor: "var(--background)" }}
            >
              {item.element}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`${robotoCondensed.className} flex gap-4 font-semibold absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`}
    >
      {menuMap.map((item) => (
        <Item key={item.link} {...item} />
      ))}
    </div>
  );
}

function Search() {
  return (
    <button>
      <Image
        src={"/svgs/search-icon.svg"}
        alt={"search icon"}
        width={16}
        height={16}
      />
    </button>
  );
}

export default function Navbar() {
  return (
    <div className="navbar page-padding fixed top-0 left-0 z-50">
      <Logo />
      <Menu />
      <Search />
    </div>
  );
}
