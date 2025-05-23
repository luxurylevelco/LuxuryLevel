import Link from "next/link";
import Image from "next/image";

export default function About() {
  return (
    <div
      id="overview"
      className="page-style flex flex-row w-full h-fit py-10 2xl:px-60 gap-10"
    >
      {/* Left side */}
      <div className="flex flex-col justify-center items-center w-1/2 gap-6">
        <div>
          <p className="font-semibold text-4xl text-black">COMPANY OVERVIEW</p>
        </div>
        <div className="flex flex-col gap-5 text-center">
          <p>
            Luxury Level was founded in 2014 in Kuwait by Rahim Ghanaei, a
            seasoned expert in the luxury watch industry. With over two decades
            of experience in business and a deep-rooted passion for horology,
            Rahim has been actively involved in the watch trade since 2002.
          </p>
          <p>
            With a career rooted in passion, precision, and integrity, Mr.
            Ghanaei has cultivated a reputation as a trusted authority in the
            high-end watch industry. Under his leadership, LL has evolved into a
            premier trading house, catering to discerning collectors and
            connoisseurs across the region.
          </p>
          <p>
            Driven by a commitment to authenticity, exclusivity, and exceptional
            client service, LL continues to set the standard in the luxury watch
            market, offering rare and prestigious timepieces that embody
            craftsmanship and heritage.
          </p>
        </div>
        <div>
          <Link href="/about-us" className="flex justify-center">
            <div className="cursor-pointer bg-white text-black text-lg font-semibold px-6 py-2 border border-black hover:bg-black hover:text-white transition duration-300 transform hover:translate-y-3 inline-block">
              Know more
            </div>
          </Link>
        </div>
      </div>

      {/* Right side (Image) */}
      <div className="w-1/2 flex justify-center items-center">
        <div className="relative w-full h-[500px]">
          <Image
            src="/homepage-assets/owner.webp"
            alt="About Us Image"
            fill
            className="object-contain"
          />
        </div>
      </div>
    </div>
  );
}
