"use client";

import { Brand, Category, ProductResponse } from "@/lib/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import dynamic from "next/dynamic";

// Lazy load Search component
const Search = dynamic(() => import("@/components/search"), { ssr: false });

interface ProductFiltersProps {
  availableColors: ProductResponse["colors"] | null;
  brandsList: ProductResponse["subBrands"];
  subCategoryList: Category[] | null;
  pathname: string;
  subBrandsList: Brand[] | null;
}

// Define a common interface for select options
interface SelectOption {
  id: string | number;
  name: string;
}

export default function ProductFilters({
  availableColors,
  brandsList,
  subCategoryList,
  pathname,
  subBrandsList,
}: ProductFiltersProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Memoize toSentenceCase
  const toSentenceCase = useCallback(
    (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase(),
    []
  );

  // Memoize formatted data
  const formattedColors = useMemo(
    () => availableColors?.map(toSentenceCase) || [],
    [availableColors, toSentenceCase]
  );

  const formattedSubCats = useMemo(
    () =>
      subCategoryList?.map((item) => {
        const name = toSentenceCase(item.name);
        return { id: name, name };
      }) || [],
    [subCategoryList, toSentenceCase]
  );

  const formattedBrands = useMemo(
    () =>
      brandsList?.map((brand) => ({
        id: brand.id,
        name: toSentenceCase(brand.name),
      })) || [],
    [brandsList, toSentenceCase]
  );

  const formattedSubBrands = useMemo(
    () =>
      subBrandsList?.map((brand) => ({
        id: brand.id,
        name: toSentenceCase(brand.name),
      })) || [],
    [subBrandsList, toSentenceCase]
  );

  // Memoize filter values
  const filters = useMemo(
    () => ({
      brand: searchParams.get("brand") || "",
      subCategory: searchParams.get("sub_category") || "",
      subBrand: searchParams.get("sub_brand") || "",
      color: searchParams.get("color") || "",
      gender: searchParams.get("gender") || "",
    }),
    [searchParams]
  );

  // Batch URL updates
  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams);
      if (value?.trim()) {
        params.set(key, value.trim());
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.replace(`/${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(
    () => Object.values(filters).some((value) => value !== ""),
    [filters]
  );

  return (
    <div className="lg:w-[500px] xl:w-full space-y-4">
      {hasActiveFilters && (
        <div className="flex justify-end">
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            aria-label="Clear all filters"
          >
            Clear All Filters
          </button>
        </div>
      )}

      <Search
        searchParamKey="name"
        placeholder="Search product name"
        className="w-full"
        pathname={pathname}
      />

      {/* Reusable Select Component */}
      {[
        {
          label: "Brand",
          key: "brand",
          value: filters.brand,
          options: formattedBrands,
        },
        {
          label: "Sub Brand",
          key: "sub_brand",
          value: filters.subBrand,
          options: formattedSubBrands,
        },
        {
          label: "Sub Category",
          key: "sub_category",
          value: filters.subCategory,
          options: formattedSubCats,
        },
        {
          label: "Color",
          key: "color",
          value: filters.color,
          options: formattedColors.map((color) => ({ id: color, name: color })),
        },
        {
          label: "Gender",
          key: "gender",
          value: filters.gender,
          options: ["Male", "Female", "Unisex"].map((gender) => ({
            id: gender,
            name: gender,
          })),
        },
      ].map(
        ({ label, key, value, options }) =>
          !!options.length && (
            <div key={key} className="relative w-full">
              <select
                className={`w-full rounded-full border px-4 py-2 text-sm appearance-none pr-10 ${
                  value
                    ? "border-gray-300 text-black"
                    : "border-gray-200 text-gray-400"
                }`}
                value={value}
                onChange={(e) => updateParam(key, e.target.value)}
                aria-label={`Select ${label}`}
              >
                <option value="">Select {label}</option>
                {options.map((option: SelectOption) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
              {value && (
                <button
                  type="button"
                  onClick={() => updateParam(key, "")}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-red-500"
                  aria-label={`Clear ${label} filter`}
                >
                  ✕
                </button>
              )}
            </div>
          )
      )}
    </div>
  );
}
