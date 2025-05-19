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
};

function Menu() {
  const menuMap: menuMapProps[] = [
    { title: "HOME", link: "/home", hasDropdown: false },
    { title: "OUR BRANDS", link: "/brands", hasDropdown: true },
    { title: "WATCHES", link: "/watches", hasDropdown: true },
    { title: "JEWELRY", link: "/jewelry", hasDropdown: true },
    { title: "BAGS", link: "/bags", hasDropdown: true },
  ];

  return (
    <div
      className={`${robotoCondensed.className} flex gap-4 font-semibold absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`}
    >
      {menuMap.map((item) => (
        <Link key={item.link} href={item.link} className="flex gap-2">
          {item.title}
          {item.hasDropdown && (
            <Image
              src={"/svgs/arrow-down.svg"}
              alt={"search icon"}
              width={10}
              height={10}
            />
          )}
        </Link>
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
