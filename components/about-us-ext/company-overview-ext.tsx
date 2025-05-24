import Image from "next/image";

export default function CompanyOverviewExt() {
  return (
    <div className="padding min-h-screen bg-white flex flex-col">
      <div className="flex flex-col md:flex-row w-full h-fit 2xl:px-40 gap-10">
        {/* Left side */}
        <div className="flex flex-col justify-center items-start w-full md:w-1/2 gap-6">
          <div>
            <p className="font-bold text-4xl text-black">
              WHAT MAKES US DIFFERENT?
            </p>
          </div>
          <div className="flex flex-col gap-5">
            <p>
              The watch market has experienced significant growth and
              recognition as a great investment opportunity in recent years.
              Luxury watches have become valuable assets, with their prices
              appreciating notably over the past five years.
            </p>
            <p>
              Luxury timepieces like Audemars Piguet, Patek Philippe, and
              Richard Mille watches have maintained their value even during
              market fluctuations. They are not only seen as fashion statements
              but also as symbols of wealth.
            </p>
            <p>
              When it comes to finding the best places worldwide to purchase
              luxury watches, Dubai stands out as a top destination. The city
              offers various options, including a wide selection of new watches
              from authorized retailers and a thriving market for pre-owned
              timepieces.
            </p>
            <p>
              In this dynamic environment, Luxury Level has emerged as a market
              leader and one of the largest dealers of pre-owned watches
              globally
            </p>
          </div>
        </div>

        {/* Right side (Image) */}
        <div className="w-full md:w-1/2 flex justify-center items-center">
          <div className="relative w-full h-[500px]">
            <Image
              src="/homepage-assets/owner.webp"
              alt="About Us Image"
              fill
              sizes="400"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
