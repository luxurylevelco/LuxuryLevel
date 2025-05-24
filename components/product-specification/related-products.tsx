"use client";

import { useState, useEffect, useRef } from "react";
import ProductCard from "../product-card";
import type { ProductInformationResponse } from "@/lib/types";

export default function RelatedProducts({
  products,
}: {
  products: ProductInformationResponse["relatedProducts"];
}) {
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(1);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Update itemsPerPage based on screen width
  useEffect(() => {
    const updateItemsPerPage = () => {
      const width = window.innerWidth;
      if (width >= 1280) setItemsPerPage(4); // xl
      else if (width >= 1024) setItemsPerPage(3); // lg
      else if (width >= 640) setItemsPerPage(2); // sm
      else setItemsPerPage(1);
    };

    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);
    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

  // Reset to first page when itemsPerPage changes
  useEffect(() => {
    setCurrentPage(0);
  }, [itemsPerPage]);

  const totalPages = Math.ceil(products.length / itemsPerPage);

  const handlePrev = () => {
    setCurrentPage((prev) => (prev === 0 ? totalPages - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => (prev === totalPages - 1 ? 0 : prev + 1));
  };

  // Don't render if no products
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="bg-white py-10 px-5 w-full h-fit flex flex-col gap-10">
      {/* Header */}
      <div className="flex w-full items-center flex-col">
        <p className="font-semibold text-3xl">Related Products</p>
      </div>

      {/* Product Carousel with Side Arrows */}
      <div className="relative flex items-center justify-center">
        {/* Previous Button */}
        {totalPages > 1 && (
          <button
            onClick={handlePrev}
            className="absolute top-1/2 left-0 transform -translate-y-1/2 text-gray-300 text-5xl hover:text-black z-10 transition-colors duration-200"
            aria-label="Previous products"
          >
            ‹
          </button>
        )}

        {/* Carousel Container */}
        <div className="overflow-hidden w-full max-w-7xl">
          <div
            ref={carouselRef}
            className="flex transition-transform duration-500 ease-in-out"
            style={{
              width: `${totalPages * 100}%`,
              transform: `translateX(-${currentPage * (100 / totalPages)}%)`,
            }}
          >
            {/* Create pages */}
            {Array.from({ length: totalPages }).map((_, pageIndex) => {
              const pageProducts = products.slice(
                pageIndex * itemsPerPage,
                (pageIndex + 1) * itemsPerPage
              );

              return (
                <div
                  key={pageIndex}
                  className="flex"
                  style={{ width: `${100 / totalPages}%` }}
                >
                  {pageProducts.map((prod, idx) => (
                    <div
                      key={`${pageIndex}-${idx}`}
                      className="flex-shrink-0 px-2 flex items-center justify-center"
                      style={{ width: `${100 / itemsPerPage}%` }}
                    >
                      <ProductCard
                        imgSrc={
                          prod.image_1 ||
                          prod.image_2 ||
                          prod.image_3 ||
                          "/placeholder-image.webp"
                        }
                        hoverImgSrc={
                          prod.image_3 || prod.image_2 || prod.image_1
                        }
                        href={`/products/${prod.id}`}
                        productName={prod.name}
                        price={prod.price ? String(prod.price) : null}
                        className="border-none"
                      />
                    </div>
                  ))}
                  {/* Fill empty slots if last page has fewer items */}
                  {pageProducts.length < itemsPerPage &&
                    Array.from({
                      length: itemsPerPage - pageProducts.length,
                    }).map((_, emptyIdx) => (
                      <div
                        key={`empty-${pageIndex}-${emptyIdx}`}
                        className="flex-shrink-0 px-2"
                        style={{ width: `${100 / itemsPerPage}%` }}
                      />
                    ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Next Button */}
        {totalPages > 1 && (
          <button
            onClick={handleNext}
            className="absolute top-1/2 right-0 transform -translate-y-1/2 text-gray-300 text-5xl hover:text-black z-10 transition-colors duration-200"
            aria-label="Next products"
          >
            ›
          </button>
        )}
      </div>

      {/* Page Indicators */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index)}
              className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                index === currentPage
                  ? "bg-black"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Go to page ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
