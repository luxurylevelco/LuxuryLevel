"use client";

import { JSX, Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import SearchComp from "@/components/search";

import { Roboto_Condensed } from "next/font/google";
import { useRouter } from "next/navigation";
import OurBrandsMenu from "@/components/dropdown-menus/brands-menu";
import WatchesMenu from "@/components/dropdown-menus/watches-menu";
import JewelryCategoriesMenu from "@/components/dropdown-menus/jewelry-menu";
import BagsMenu from "@/components/dropdown-menus/bags-menu";
import { Brand, Category } from "@/lib/types";
const robotoCondensed = Roboto_Condensed({
  subsets: ["latin"],
  weight: ["400", "700"],
});

function Logo() {
  return (
    <Link href={"/"}>
      <Image
        src={"/svgs/level-logo.svg"}
        alt={"search icon"}
        className="object-contain "
        width={50}
        height={50}
      />
    </Link>
  );
}

type menuMapProps = {
  title: string;
  link: string;
  hasDropdown: boolean;
  element?: JSX.Element;
};

function MenuItem({
  title,
  link,
  hasDropdown,
  element,
  isOpen,
  onToggle,
  toggleMobileNav,
}: menuMapProps & {
  isOpen: boolean;
  onToggle: () => void;
  toggleMobileNav?: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const { push } = useRouter();

  const mobileItemRedirect = () => {
    if (toggleMobileNav) {
      toggleMobileNav();
    }
    push(link);
  };

  return (
    <div className="w-full lg:w-auto lg:relative">
      {/* Desktop */}
      <div
        className="hidden lg:block"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Link href={link} className="flex gap-2 items-center">
          {title}
          {hasDropdown && (
            <Image
              src="/svgs/arrow-down.svg"
              alt="arrow"
              width={10}
              height={10}
              className={`transition-transform duration-300 ${
                isHovered ? "-rotate-180" : "rotate-0"
              }`}
            />
          )}
        </Link>

        {hasDropdown && (
          <div
            className={`absolute top-4 left-1/2 -translate-x-1/2 mt-2 w-max z-50 transition-all duration-300 ease-out ${
              isHovered
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-2 pointer-events-none"
            }`}
          >
            <div className="flex justify-center w-full h-[20px]">
              <Image
                src="/svgs/arrow-up-filled.svg"
                alt="arrow up"
                width={20}
                height={20}
              />
            </div>

            <div className="card-style">{element}</div>
          </div>
        )}
      </div>

      {/* Mobile */}
      <div className="lg:hidden w-full">
        <div className="flex justify-between w-full items-center py-2">
          <button onClick={mobileItemRedirect}>{title}</button>
          {hasDropdown && (
            <button>
              <Image
                onClick={onToggle}
                src="/svgs/arrow-down.svg"
                alt="arrow"
                width={10}
                height={10}
                className={`transition-transform duration-300 ${
                  isOpen ? "-rotate-180" : "rotate-0"
                }`}
              />
            </button>
          )}
        </div>

        {hasDropdown && (
          <div
            className={`overflow-hidden transition-all duration-300 ${
              isOpen
                ? "max-h-64 opacity-100 overflow-y-auto"
                : "max-h-0 opacity-0"
            }`}
          >
            <div className="pl-4 py-2 font-normal">{element}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function Menu({
  toggleMobileNav,
  brandsMenu,
  jewelryMenu,
  bagsMenu,
}: {
  toggleMobileNav?: () => void;
  brandsMenu: Brand[];
  jewelryMenu: Category[];
  bagsMenu: Brand[];
}) {
  const [activeItem, setActiveItem] = useState<string | null>(null);

  const menuMap: menuMapProps[] = [
    { title: "HOME", link: "/", hasDropdown: false },
    {
      title: "OUR BRANDS",
      link: "/brands",
      hasDropdown: true,
      element: (
        <OurBrandsMenu toggleMobileNav={toggleMobileNav} brands={brandsMenu} />
      ),
    },
    {
      title: "WATCHES",
      link: "/watches",
      hasDropdown: true,
      element: <WatchesMenu toggleMobileNav={toggleMobileNav} />,
    },
    {
      title: "JEWELRY",
      link: "/jewelry",
      hasDropdown: true,
      element: (
        <JewelryCategoriesMenu
          toggleMobileNav={toggleMobileNav}
          categories={jewelryMenu}
        />
      ),
    },
    {
      title: "BAGS",
      link: "/bags",
      hasDropdown: true,
      element: <BagsMenu toggleMobileNav={toggleMobileNav} brands={bagsMenu} />,
    },
    {
      title: "CONTACT US",
      link: "/contact-us",
      hasDropdown: false,
    },
  ];

  return (
    <div
      className={`flex ${robotoCondensed.className} gap-4 font-semibold lg:absolute lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 flex-col lg:flex-row `}
    >
      {menuMap.map((item) => (
        <MenuItem
          key={item.link}
          {...item}
          isOpen={activeItem === item.link}
          onToggle={() =>
            setActiveItem((prev) => (prev === item.link ? null : item.link))
          }
          toggleMobileNav={toggleMobileNav}
        />
      ))}
    </div>
  );
}

function MobileMenuButton(props: {
  brandsMenu: Brand[];
  jewelryMenu: Category[];
  bagsMenu: Brand[];
}) {
  const [isMobileNavOpen, setisMobileNavOpen] = useState<boolean>(false);
  const toggleMobileNav = () => {
    setisMobileNavOpen(!isMobileNavOpen);
  };
  return (
    <>
      <button className="flex lg:hidden" onClick={toggleMobileNav}>
        <Image
          src={"/svgs/hamburger-menu.svg"}
          alt={"hamburger-menu icon"}
          width={24}
          height={24}
        />
      </button>

      <div
        className={`overlay ${isMobileNavOpen ? "flex" : "-translate-x-full"}`}
      />

      <div
        className={`fixed top-0 left-0 h-screen w-[75%] space-y-6 bg-white z-50 shadow-lg transform transition-transform duration-300 p-6
    ${isMobileNavOpen ? "translate-x-0" : "-translate-x-full"}
  `}
      >
        <Suspense>
          <SearchComp
            className={""}
            toggleMobileNav={toggleMobileNav}
            searchParamKey="name"
            placeholder="Search All Products..."
            pathname="products"
            resetOnSearch={true}
          />
        </Suspense>

        <Menu toggleMobileNav={toggleMobileNav} {...props} />
        <button
          className={`flex lg:hidden absolute top-2 -right-12 rounded-full default-white-bg p-2 shadow-md ${
            isMobileNavOpen ? "flex" : "hidden"
          }`}
          onClick={toggleMobileNav}
        >
          <Image
            src={"/svgs/x-icon.svg"}
            alt={"hamburger-menu icon"}
            width={16}
            height={16}
          />
        </button>
      </div>
    </>
  );
}

function DesktopSearch() {
  const [isClicked, setIsClicked] = useState<boolean>(false);

  const toggleClick = () => setIsClicked(!isClicked);

  return (
    <div className="relative flex items-center gap-2">
      {/* Search Button */}
      <button onClick={toggleClick}>
        <Image
          src={isClicked ? "/svgs/x-icon.svg" : "/svgs/search-icon.svg"}
          alt="search icon"
          width={16}
          height={16}
        />
      </button>

      {/* Animated Search Input */}
      <div
        className={`absolute right-8 top-1/2 w-[250px] -translate-y-1/2  transition-all duration-300 ease-in-out transform ${
          isClicked
            ? "-translate-x-0 opacity-100"
            : "translate-x-10 opacity-0 pointer-events-none"
        }`}
      >
        <SearchComp
          className="w-[250px]"
          pathname="products"
          searchParamKey="name"
          resetOnSearch={true}
          placeholder="Search All Products..."
        />
      </div>
    </div>
  );
}

export default function Navbar(props: {
  brandsMenu: Brand[];
  jewelryMenu: Category[];
  bagsMenu: Brand[];
}) {
  return (
    <div className="navbar ">
      <Logo />
      <MobileMenuButton {...props} />
      <div className="hidden lg:flex">
        <Menu {...props} />
      </div>
      <Suspense>
        <div className="hidden lg:flex">
          <DesktopSearch />
        </div>
      </Suspense>
    </div>
  );
}
