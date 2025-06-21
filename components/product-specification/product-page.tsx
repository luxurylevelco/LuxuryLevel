"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import RelatedProducts from "./related-products";
import { ProductInformationResponse } from "@/lib/types";
import { getWhatsAppUrl } from "@/lib/utils";

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
      className="relative  w-full  overflow-hidden  flex items-center justify-center"
    >
      <Image
        src={src || "/placeholder-image.webp"}
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

  const message = `Hi! I'd like to inquire about ${productInfo.name}\n\nHere's the link:\n${process.env.NEXT_PUBLIC_FRONTEND_URL}/products/${productInfo.id}`;

  return (
    <div className="bg-white w-full min-h-screen padding py-20 md:px-20 md:py-32 2xl:px-72 2xl:py-40 flex flex-col gap-10">
      <div className="h-fit w-full flex flex-col lg:flex-row lg:justify-between gap-10 lg:gap-0">
        {/* Product Images */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4 ">
          {/* Main Display Image with Navigation */}
          <div className="relative lg:w-fit ">
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
          <div className="flex gap-2 ">
            {imageSources.map((src, index) => {
              if (!src) return null;

              return (
                <Image
                  key={index}
                  src={src}
                  alt={`Thumbnail ${index + 1}  `}
                  width={80}
                  height={80}
                  className={`cursor-pointer hover:-translate-y-1 transition-transform duration-300 object-contain  ${
                    currentIndex === index ? "" : "bg-black opacity-50"
                  }`}
                  onClick={() => setCurrentIndex(index)}
                />
              );
            })}
          </div>
        </div>

        {/* Product Specs */}
        <div className="w-full lg:w-1/3 flex flex-col gap-5 ">
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
              href={getWhatsAppUrl({
                message: encodeURIComponent(message),
              })}
              target="_blank"
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
              href={`/contact-us?message=${encodeURIComponent(message)}`}
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
        <div className=" border-b lg:border-r border-gray-300" />

        {/* Brand Info */}
        <div className="flex flex-col items-center ">
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
        <div className="bg-gray-100 rounded-lg w-full h-fit  p-4 sm:p-10 ">
          {productInfo.description?.split("\n").map((details, index) => {
            if (
              details.includes(":") &&
              details.split(":").length === 2 &&
              details.split(" ").length < 20
            ) {
              const specDetail = details.split(":");
              return (
                <p key={index} className="font-semibold mt-1 text-lg">
                  {specDetail[0]}
                  {":"}
                  <span className="font-normal">{specDetail[1]}</span>
                </p>
              );
            }

            if (details.split(" ").length < 10) {
              return (
                <p key={index} className="font-semibold text-2xl mt-4 ">
                  {details}
                </p>
              );
            }

            return (
              <p key={index} className="">
                {details}
              </p>
            );
          })}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <RelatedProducts products={relatedProducts} />
      )}
    </div>
  );
}
