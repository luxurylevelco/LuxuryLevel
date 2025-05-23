import Image from "next/image";

export default function CollectionInfo() {
  return (
    <div className="flex flex-col bg-background h-fit w-full 2xl:px-40 py-10 gap-8">
      <div className="flex flex-col gap-3 text-center">
        <p className="font-bold text-3xl">THE LUXURY LEVEL COLLECTION</p>
        <p>
          At Luxury Level, we take pride in offering an unparalleled collection
          of luxury watches that sets us apart from the rest:
        </p>
        <div className="relative w-full h-[500px]">
          <Image
            src="/homepage-assets/collection-img.webp"
            alt="Watch Collection"
            fill
            className="object-cover"
          />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex flex-row gap-3">
          <div className="flex flex-col border-2 border-gray-300 p-5 gap-5 text-center">
            <p className="font-bold text-2xl">
              World&apos;s Largest In-Store Collection
            </p>
            <p>
              Luxury Souq is proud to offer the largest selection of luxury
              watches available in our physical and online store, unlike many
              other stores. <br /> <br /> With our wide range of watches, you
              have the opportunity to explore different styles and find the
              perfect watch that matches your taste and preferences.
            </p>
          </div>
          <div className="flex flex-col border-2 border-gray-300 p-5 gap-5 text-center">
            <p className="font-bold text-2xl">
              Most Expensive Watches in the World
            </p>
            <p>
              LuxurySouq offers the finest luxury and exclusivity. Our
              collection includes some of the most expensive watches globally.{" "}
              <br /> <br /> These watches are exceptional, carefully crafted
              with great attention to detail. They are made from rare materials,
              have intricate features, and showcase stunning designs.
            </p>
          </div>
          <div className="flex flex-col border-2 border-gray-300 p-5 gap-5 text-center">
            <p className="font-bold text-2xl">
              Rare and Limited Edition of Watches
            </p>
            <p>
              At LuxurySouq, we take great pride in selecting a collection of
              unique and limited-edition watches that appeal to passionate
              collectors. <br /> <br /> These watches have fascinating stories
              behind them, special features that make them stand out, and are
              produced in limited quantities.
            </p>
          </div>
        </div>
        <div className="flex flex-row gap-3">
          <div className="flex flex-col w-1/2 border-2 border-gray-300 p-5 gap-5 text-center">
            <p className="font-bold text-2xl">Exclusive Waiting List Access</p>
            <p>
              At Luxury Souq, we make extra efforts to fulfill the requests of
              our valued customers. Help you get on waiting lists for watches
              that are in high demand and often have long waiting times at
              boutiques. <br /> <br /> Choosing Luxury Souq means accessing the
              premium waiting lists, allowing you to acquire sought-after
              timepieces without the usual waiting period.
            </p>
          </div>
          <div className="flex flex-col w-1/2 border-2 border-gray-300 p-5 gap-5 text-center">
            <p className="font-bold text-2xl">
              Trading in 70 Swiss-Made Watch Brands
            </p>
            <p>
              Luxury Souq is dealing with more than 70 Swiss Made watch brands.
              We offer a complete trading service. <br /> <br /> We make sure
              our clients receive fair assessments and competitive prices,
              making the process easy and rewarding.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
