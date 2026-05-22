"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import RelatedProducts from "./related-products";
import CompareButton from "./compare-button";
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
      className="relative w-full aspect-square bg-zinc-50 rounded-2xl overflow-hidden flex items-center justify-center group border border-zinc-100 shadow-sm"
    >
      <Image
        src={src || "/placeholder-image.webp"}
        alt="Product Image"
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className={`object-contain p-8 transition-transform duration-700 ease-out ${
          isHovering ? "cursor-zoom-in scale-[1.7]" : "scale-100"
        }`}
        style={{
          transformOrigin: `${position.x}% ${position.y}%`,
        }}
      />
      {/* Subtle overlay hint */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500 pointer-events-none" />
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

  if (productInfo.image_1) imageSources.push(productInfo.image_1);
  if (productInfo.image_2) imageSources.push(productInfo.image_2);
  if (productInfo.image_3) imageSources.push(productInfo.image_3);

  const [currentIndex, setCurrentIndex] = useState(0);

  const message = `Hi! I'd like to inquire about ${productInfo.name}\n\nHere's the link:\n${process.env.NEXT_PUBLIC_FRONTEND_URL}/products/${productInfo.id}`;

  return (
    <div className="bg-white w-full min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb / Top Navigation (Optional but adds a premium feel) */}
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 uppercase tracking-widest mb-8">
          <Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link>
          <span>/</span>
          <Link href={`/brands/${brandInfo.id}`} className="hover:text-zinc-900 transition-colors">{brandInfo.name}</Link>
          <span>/</span>
          <span className="text-zinc-900 truncate max-w-[200px] sm:max-w-xs">{productInfo.name}</span>
        </div>

        {/* 2-Column Luxury Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          
          {/* LEFT: Image Gallery (Takes up 7 columns) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <ZoomableImage src={imageSources[currentIndex] || ""} />

            {/* Premium Thumbnails */}
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {imageSources.map((src, index) => {
                if (!src) return null;
                const isActive = currentIndex === index;

                return (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 transition-all duration-300 ease-out bg-zinc-50 border-2 ${
                      isActive 
                        ? "border-zinc-900 shadow-md scale-100" 
                        : "border-transparent hover:border-zinc-300 opacity-60 hover:opacity-100 scale-95 hover:scale-100"
                    }`}
                  >
                    <Image
                      src={src}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      className="object-contain p-2"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Product Information (Takes up 5 columns) */}
          <div className="lg:col-span-5 flex flex-col">
            
            {/* Brand Logo & Name */}
            <Link href={`/brands/${brandInfo.id}`} className="group flex items-center gap-4 mb-6 w-fit">
              {brandInfo.logo_url && (
                <div className="relative w-16 h-16 rounded-full border border-zinc-100 shadow-sm bg-white overflow-hidden group-hover:shadow-md transition-shadow duration-300">
                  <Image src={brandInfo.logo_url} alt={brandInfo.name} fill className="object-contain p-2" />
                </div>
              )}
              <p className="text-sm font-bold tracking-widest uppercase text-zinc-500 group-hover:text-zinc-900 transition-colors duration-300">
                {brandInfo.name}
              </p>
            </Link>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-light text-zinc-900 leading-tight mb-6">
              {productInfo.name}
            </h1>

            {/* Price Display */}
            <div className="mb-8">
              {(productInfo as any).display_sale_price ? (
                <div className="flex items-baseline gap-4">
                  <p className="text-3xl font-medium text-red-600 tracking-tight">
                    {(productInfo as any).display_sale_price}
                  </p>
                  <p className="text-xl text-zinc-400 line-through font-light">
                    {(productInfo as any).display_price}
                  </p>
                </div>
              ) : (
                <p className="text-3xl font-medium text-zinc-900 tracking-tight">
                  {(productInfo as any).display_price}
                </p>
              )}
              <p className="text-xs text-zinc-400 mt-2 font-light">
                * Prices and availability subject to change at any time.
              </p>
            </div>

            <hr className="border-zinc-100 mb-8" />

            {/* Specs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 mb-10">
              <div className="flex flex-col gap-1 border-b border-zinc-100 pb-3">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Ref No</span>
                <span className="text-zinc-900 font-medium">{productInfo.ref_no || "N/A"}</span>
              </div>
              <div className="flex flex-col gap-1 border-b border-zinc-100 pb-3">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Color</span>
                <span className="text-zinc-900 font-medium">{productInfo.color || "N/A"}</span>
              </div>
              <div className="flex flex-col gap-1 border-b border-zinc-100 pb-3 sm:col-span-2">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Gender</span>
                <span className="text-zinc-900 font-medium">{productInfo.gender || "N/A"}</span>
              </div>
            </div>

            {/* Action Buttons (Premium Styling) */}
            <div className="flex flex-col gap-3 mt-auto">
              <Link
                href={getWhatsAppUrl({ message: encodeURIComponent(message) })}
                target="_blank"
                className="group relative w-full flex items-center justify-center gap-3 bg-[#25D366] text-white py-4 rounded-xl font-semibold overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-[#25D366]/30 hover:-translate-y-0.5"
              >
                <div className="absolute inset-0 bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <Image src={"/homepage-assets/whatsapp-logo.webp"} alt="WhatsApp" width={20} height={20} className="relative z-10" />
                <span className="relative z-10 tracking-wide">Inquire on WhatsApp</span>
              </Link>
              
              <Link
                href={`/contact-us?message=${encodeURIComponent(message)}`}
                className="group relative w-full flex items-center justify-center gap-3 bg-white border-2 border-zinc-900 text-zinc-900 py-4 rounded-xl font-semibold transition-all duration-300 hover:bg-zinc-900 hover:text-white"
              >
                <span className="tracking-wide">Send an Email</span>
              </Link>
              
                <div className="mt-2 flex justify-center">
                  {/* BAGO: Kung walang brand sa productInfo, gagamitin niya yung brandInfo ng page! */}
                  <CompareButton 
                    product={{ 
                      ...productInfo, 
                      brand: productInfo.brand || brandInfo 
                    }} 
                  />
                </div>
            </div>

          </div>
        </div>

        {/* Product Description - Editorial Style */}
        {productInfo.description && (
          <div className="mt-24 lg:mt-32 max-w-4xl mx-auto text-center">
            <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-zinc-400 mb-8">
              Product Details
            </h2>
            <div className="bg-zinc-50/50 rounded-3xl p-8 sm:p-12 border border-zinc-100 shadow-sm transition-all duration-500 hover:shadow-md">
              <div className="text-zinc-600 font-light text-base sm:text-lg leading-relaxed space-y-6 text-left">
                {productInfo.description?.split("\n").map((details, index) => {
                  if (details.includes(":") && details.split(":").length === 2 && details.split(" ").length < 20) {
                    const specDetail = details.split(":");
                    return (
                      <div key={index} className="flex justify-between border-b border-zinc-200/50 pb-2">
                        <span className="font-medium text-zinc-900">{specDetail[0]}</span>
                        <span className="text-zinc-500">{specDetail[1]}</span>
                      </div>
                    );
                  }
                  if (details.split(" ").length < 10) {
                    return (
                      <p key={index} className="font-medium text-2xl text-zinc-900 mt-8 mb-4 text-center">
                        {details}
                      </p>
                    );
                  }
                  return <p key={index}>{details}</p>;
                })}
              </div>
            </div>
          </div>
        )}

        {/* Related Products Divider */}
        {relatedProducts.length > 0 && (
          <div className="mt-24">
            <div className="flex items-center gap-6 mb-12">
              <div className="flex-1 h-px bg-zinc-200" />
              <h2 className="text-xl font-light tracking-widest uppercase text-zinc-900">
                You May Also Like
              </h2>
              <div className="flex-1 h-px bg-zinc-200" />
            </div>
            <RelatedProducts products={relatedProducts} />
          </div>
        )}
        
      </div>
    </div>
  );
}