"use client";

import Search from "@/components/search";
import { Brand, Category, ProductResponse } from "@/lib/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export default function ProductFilters({
  availableColors,
  brandsList,
  subCategoryList,
  pathname,
  subBrandsList,
}: {
  availableColors: ProductResponse["colors"] | null;
  brandsList: Brand[] | null;
  subCategoryList: Category[] | null;
  pathname: string;
  subBrandsList: Brand[] | null;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const toSentenceCase = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

  // Format available colors to sentence case
  const formattedColors = availableColors?.map(toSentenceCase) || [];

  // Format Sub Categories with sentence case
  const formattedSubCats =
    subCategoryList?.map((item) => ({
      ...item,
      name: toSentenceCase(item.name),
    })) || [];

  // Format Brands with sentence case for display consistency
  const formattedBrands =
    brandsList?.map((brand) => ({
      ...brand,
      name: toSentenceCase(brand.name),
    })) || [];

  const formattedSubBrands =
    subBrandsList?.map((brand) => ({
      ...brand,
      name: toSentenceCase(brand.name),
    })) || [];

  // Get selected filter values from URL params
  const selectedBrandName = searchParams.get("brand") || "";
  const selectedSubCatName = searchParams.get("sub_category") || "";
  const selectedSubBrandName = searchParams.get("sub_brand") || "";
  const selectedColor = searchParams.get("color") || "";
  const selectedGender = searchParams.get("gender") || "";

  // Update param helper: store names in URL (not IDs)
  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearAllFilters = useCallback(() => {
    router.push(`/`); // clear all
  }, [router]);

  return (
    <div className="lg:w-[500px] xl:w-full space-y-4">
      <div className="flex items-center justify-between">
        {(selectedColor ||
          selectedGender ||
          selectedBrandName ||
          selectedSubCatName) && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear All Filters
          </button>
        )}
      </div>

      {/* Search Input */}
      <Search
        searchParamKey="name"
        placeholder="Search watch name/title..."
        className="w-full"
        pathname={pathname}
      />

      {/* Brand Filter */}
      {!!formattedBrands.length && (
        <div className="relative w-full">
          <select
            className="w-full rounded-full border px-4 py-2 text-sm appearance-none pr-10"
            value={selectedBrandName}
            onChange={(e) => updateParam("brand", e.target.value)}
          >
            <option value="">Select Brand</option>
            {formattedBrands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
          {selectedBrandName && (
            <button
              type="button"
              onClick={() => updateParam("brand", "")}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-red-500"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Sub Brand Filter if there is any */}
      {!!formattedSubBrands.length && (
        <div className="relative w-full">
          <select
            className="w-full rounded-full border px-4 py-2 text-sm appearance-none pr-10"
            value={selectedSubBrandName}
            onChange={(e) => updateParam("sub_brand", e.target.value)}
          >
            <option value="">Select Sub Brand</option>
            {formattedSubBrands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
          {selectedSubBrandName && (
            <button
              type="button"
              onClick={() => updateParam("sub_brand", "")}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-red-500"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Sub Category Filter */}
      {!!formattedSubCats.length && (
        <div className="relative w-full">
          <select
            className="w-full rounded-full border px-4 py-2 text-sm appearance-none pr-10"
            value={toSentenceCase(selectedSubCatName)}
            onChange={(e) => updateParam("sub_category", e.target.value)}
          >
            <option value="">Select Sub Category</option>
            {formattedSubCats.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
          {selectedSubCatName && (
            <button
              type="button"
              onClick={() => updateParam("sub_category", "")}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-red-500"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Color Filter */}
      <div className="relative w-full">
        <select
          className="w-full rounded-full border px-4 py-2 text-sm appearance-none pr-10"
          value={selectedColor}
          onChange={(e) => updateParam("color", e.target.value)}
        >
          <option value="">Select Color</option>
          {formattedColors.map((color) => (
            <option key={color} value={color}>
              {color}
            </option>
          ))}
        </select>
        {selectedColor && (
          <button
            type="button"
            onClick={() => updateParam("color", "")}
            className="absolute right-6 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-red-500"
          >
            ✕
          </button>
        )}
      </div>

      {/* Gender Filter */}
      <div className="relative w-full">
        <select
          className="w-full rounded-full border px-4 py-2 text-sm appearance-none pr-10"
          value={selectedGender}
          onChange={(e) => updateParam("gender", e.target.value)}
        >
          <option value="">Select Gender</option>
          {["Male", "Female", "Unisex"].map((gender) => (
            <option key={gender} value={gender}>
              {gender}
            </option>
          ))}
        </select>
        {selectedGender && (
          <button
            type="button"
            onClick={() => updateParam("gender", "")}
            className="absolute right-6 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-red-500"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
