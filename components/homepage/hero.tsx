import { getWhatsAppUrl } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <div className="section-style relative bg-[url('/homepage-assets/hero.avif')] bg-no-repeat bg-[center_top_20px] bg-[length:800px_auto] 2xl:bg-[length:auto]  p-20 bg-[#000100] ">
      <div className="absolute bottom-14 left-10 md:bottom-28 md:left-24 flex flex-col h-fit">
        <Link href={getWhatsAppUrl({ message: "" })} target="_blank">
          <div className="w-[100px]">
            <Image
              src="/homepage-assets/whatsapp-logo.webp"
              alt="Whatsapp"
              width={500}
              height={500}
              className="w-full h-auto"
            />
          </div>

          <div>
            <p className="font-semibold text-white text-2xl">Message us on</p>
            <p className="font-bold text-white text-2xl">Whatsapp</p>
          </div>
        </Link>

        <div className="pt-5">
          <p className="text-gray-400 text-lg">
            Get First Access To New Arrivals
          </p>
          <p className="text-gray-400 text-lg">Exclusive Offers And Updates</p>
        </div>
      </div>
    </div>
  );
}
