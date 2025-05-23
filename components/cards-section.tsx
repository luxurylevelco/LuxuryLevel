"use client";

import { Brand, Category, ProductResponse } from "@/lib/types";
import ProductCard from "@/components/product-card";
import Pagination from "@/components/pagination";
import ProductFilters from "@/components/product-filters";

export default function CardsSection({
  products,
  pageInfo,
  brandsList = [],
  colorsList,
  subCategoryList,
  subBrandsList,
  pathname,
}: {
  products: ProductResponse["products"];
  pageInfo: ProductResponse["page"];
  brandsList: ProductResponse["subBrands"];
  colorsList: ProductResponse["colors"] | null;
  subCategoryList: Category[] | null;
  pathname: string;
  subBrandsList: Brand[] | null;
}) {
  return (
    <div className="w-full min-h-screen padding bg-white gap-4 flex  ">
      <div className="w-full flex justify-start items-start xl:w-1/4 flex-col gap-2">
        <h1 className="text-lg font-semibold">Filters</h1>
        <ProductFilters
          availableColors={colorsList}
          brandsList={brandsList}
          subCategoryList={subCategoryList}
          pathname={pathname}
          subBrandsList={subBrandsList}
        />
      </div>
      <div className="flex flex-col w-full space-y-10 xl:w-3/4">
        <div className="w-full  grid grid-cols-2 md:grid-cols-3  lg:grid-cols-4 2xl:grid-cols-6  gap-4">
          {products.length > 0 ? (
            <>
              {products?.map((product) => (
                <ProductCard
                  key={product.id}
                  imgSrc={product.image_1 || "/placeholder-image.webp"}
                  hoverImgSrc={
                    product.image_3 || product.image_2 || product.image_1
                  }
                  productName={product.name}
                  price={product.price ? String(product.price) : null}
                  className="hover:border-gray-200 hover:border transition-all duration-200 hover:scale-105"
                  href={`/products/${product.id}`}
                />
              ))}
            </>
          ) : (
            <>No Available Products</>
          )}
        </div>
        {!!pageInfo && <Pagination pageInfo={pageInfo} />}
      </div>
    </div>
  );
}
