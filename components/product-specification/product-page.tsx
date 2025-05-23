"use client";

import { useState, useRef, Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import RelatedProducts from "./related-products";
import { ProductInformationResponse } from "@/lib/types";

function ZoomableImage({ src }: { src: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { left, top, width, height } =
      containerRef.current!.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setPosition({ x, y });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className="relative w-[450px] h-[450px] overflow-hidden"
    >
      <Image
        src={src}
        alt="Zoomed Product Image"
        width={450}
        height={450}
        className={`object-cover transition-transform duration-300 ${
          isHovering ? "cursor-zoom-in scale-150" : "scale-100"
        }`}
        style={{
          transformOrigin: `${position.x}% ${position.y}%`,
        }}
      />
    </div>
  );
}

// Component
export default function ProductInfo({
  brandInfo,
  productInfo,
  relatedProducts,
}: ProductInformationResponse) {
  const imageSources: string[] = [];

  if (productInfo.image_1) {
    imageSources.push(productInfo.image_1);
  }
  if (productInfo.image_2) {
    imageSources.push(productInfo.image_2);
  }
  if (productInfo.image_3) {
    imageSources.push(productInfo.image_3);
  }

  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? imageSources.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prev) =>
      prev === imageSources.length - 1 ? 0 : prev + 1
    );
  };

  const textArr = productInfo.description?.split(/\n+Watch Specification\n+/i);

  const hasWatchSpecs = productInfo.description?.includes(
    "Watch Specification"
  );

  const isWatchSpecsIndexTwo = textArr && textArr?.length > 1 && hasWatchSpecs;

  let desc: string[] = [];
  let specs: string[] = [];

  if (textArr) {
    if (isWatchSpecsIndexTwo) {
      desc = textArr?.[0]
        ?.split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean);
      specs = textArr?.[1]
        ?.split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean);
    } else {
      desc = textArr?.[1]
        ?.split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean);
      specs = textArr?.[0]?.split(/\n+/).map((line) => line.trim());
    }
  }

  return (
    <div className="bg-white w-full min-h-screen px-20 py-32 2xl:px-72 2xl:py-40 flex flex-col gap-20">
      <div className="h-fit w-full flex flex-row justify-between">
        {/* Product Images */}
        <div className="w-1/3 flex flex-col gap-4">
          {/* Main Display Image with Navigation */}
          <div className="relative w-fit">
            <ZoomableImage src={imageSources[currentIndex] || ""} />

            {/* Navigation Buttons */}
            <button
              onClick={goToPrev}
              className="absolute top-1/2 left-0 transform -translate-y-1/2 text-gray-300 text-7xl hover:text-black z-10"
            >
              ‹
            </button>
            <button
              onClick={goToNext}
              className="absolute top-1/2 right-0 transform -translate-y-1/2 text-gray-300 text-7xl hover:text-black z-10"
            >
              ›
            </button>
          </div>

          {/* Thumbnails */}
          <div className="flex gap-2">
            {imageSources.map((src, index) => {
              if (!src) return null;

              return (
                <Image
                  key={index}
                  src={src}
                  alt={`Thumbnail ${index + 1}`}
                  width={100}
                  height={100}
                  className={`cursor-pointer hover:-translate-y-1 transition-transform duration-300 ${
                    currentIndex === index ? "" : "bg-black opacity-50"
                  }`}
                  onClick={() => setCurrentIndex(index)}
                />
              );
            })}
          </div>
        </div>

        {/* Product Specs */}
        <div className="w-1/3 flex flex-col gap-5">
          <p className="text-3xl font-semibold">{productInfo.name}</p>

          {/* <p className="text-gray-500">
            Our price:{" "}
            <span className="text-xl text-green-700 font-bold">
              {product.price}
            </span>
          </p> */}

          {/* <p className="font-semibold text-gray-500 italic">
            ** Prices and availability subject to change at any time and does
            not constitute a contract **
          </p> */}

          <div className="flex justify-between border-b">
            <span>Ref No:</span>
            <span>{productInfo.ref_no || "N/A"}</span>
          </div>

          <div className="flex justify-between border-b">
            <span>Color:</span>
            <span>{productInfo.color || "N/A"}</span>
          </div>

          <div className="flex justify-between border-b">
            <span>Gender:</span>
            <span>{productInfo.gender || "N/A"}</span>
          </div>

          <div className="flex w-full flex-col gap-2 mt-10">
            <Link
              href="/"
              className="bg-green-600 hover:bg-green-700  text-white button"
            >
              <Image
                src={"/homepage-assets/whatsapp-logo.webp"}
                alt={"inquire in whatsapp button"}
                width={24}
                height={24}
              />
              <span>Inquire on WhatsApp</span>
            </Link>
            <Link
              href="/"
              className=" hover:bg-gray-100  border text-black button"
            >
              <Image
                src={"/svgs/email-black.svg"}
                alt={"inquire in whatsapp button"}
                width={24}
                height={24}
              />
              <span>Send an email</span>
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="border-r border-gray-300" />

        {/* Brand Info */}
        <div className="w-60 flex flex-col items-center">
          <p className="text-lg font-semibold">{brandInfo.name}</p>
          <Link href={`/brands/${brandInfo.id}`}>
            <Image
              src={brandInfo.logo_url || ""}
              alt={brandInfo.name}
              width={180}
              height={180}
              className="cursor-pointer"
            />
          </Link>
        </div>
      </div>

      {/* Description  */}

      <div className="h-fit flex flex-col items-start text-lg gap-6">
        {desc && (
          <div className="flex flex-col gap-3">
            <p className="font-bold text-3xl">Description</p>

            {desc?.map((line, index) => {
              const isTitle = line.split(" ").length <= 8;

              if (index === 0) {
                return (
                  <Fragment key={index}>
                    {" "}
                    <p
                      key={index}
                      className={`${isTitle && "font-semibold text-2xl"}`}
                    >
                      {line}
                    </p>
                    <div className="my-5 border-b" />
                  </Fragment>
                );
              }

              return (
                <p
                  key={index}
                  className={`${isTitle && "font-semibold text-2xl"}`}
                >
                  {line}
                </p>
              );
            })}
          </div>
        )}

        <div className="bg-gray-100 rounded-lg w-full h-fit mt-10 p-10">
          <p className="font-bold text-2xl mb-4">Watch Specification</p>
          <ul className="list-disc pl-5 space-y-2">
            {specs?.map((details, index) => {
              const detailsArr = details.split(":");
              return (
                <li key={index}>
                  <p className="font-bold">
                    {detailsArr?.[0]} :
                    <span className="font-normal ml-2">{detailsArr?.[1]}</span>
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Related Products */}
      <div>
        <RelatedProducts products={relatedProducts} />
      </div>
    </div>
  );
}
