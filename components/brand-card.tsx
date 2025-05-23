import Image from "next/image";
import Link from "next/link";

export interface BrandCardProps {
  imgSrc: string;
  href: string;
  desc?: string;
}

export default function BrandCard({ imgSrc, href, desc }: BrandCardProps) {
  return (
    <Link
      href={href}
      className="block hover:scale-105 transition-all duration-200"
    >
      <div className="relative h-[200px] w-full rounded-xl  overflow-hidden transform transition duration-300 ">
        <Image src={imgSrc} alt="Watch" fill className="object-contain" />
      </div>
      {desc && <p className="text-center  text-sm lg:text-lg">{desc}</p>}
    </Link>
  );
}
