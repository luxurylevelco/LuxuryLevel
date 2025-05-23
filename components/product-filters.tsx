"use client";

import { Brand, Category, ProductResponse } from "@/lib/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

import dynamic from "next/dynamic";
const Search = dynamic(() => import("@/components/search"), { ssr: false });

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

  // Memoize toSentenceCase
  const toSentenceCase = useMemo(
    () => (str: string) =>
      str.charAt(0).toUpperCase() + str.slice(1).toLowerCase(),
    []
  );

  // Memoize formatted data
  const formattedColors = useMemo(
    () => availableColors?.map(toSentenceCase) || [],
    [availableColors, toSentenceCase]
  );

  const formattedSubCats = useMemo(
    () =>
      subCategoryList?.map((item) => ({
        ...item,
        name: toSentenceCase(item.name),
      })) || [],
    [subCategoryList, toSentenceCase]
  );

  const formattedBrands = useMemo(
    () =>
      brandsList?.map((brand) => ({
        ...brand,
        name: toSentenceCase(brand.name),
      })) || [],
    [brandsList, toSentenceCase]
  );

  const formattedSubBrands = useMemo(
    () =>
      subBrandsList?.map((brand) => ({
        ...brand,
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

  // Update param helper
  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  // Check if any filters are applied
  const hasFilters = Object.values(filters).some((value) => value !== "");

  // Reusable FilterSelect component with generics
  const FilterSelect = <T extends string | Brand | Category>({
    options,
    paramKey,
    placeholder,
    value,
  }: {
    options: T[];
    paramKey: string;
    placeholder: string;
    value: string;
  }) => (
    <div className="relative w-full">
      <select
        className="w-full rounded-full border px-4 py-2 text-sm appearance-none pr-10"
        value={value}
        onChange={(e) => updateParam(paramKey, e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => {
          const id = typeof option === "string" ? option : option.id;
          const name = typeof option === "string" ? option : option.name;
          return (
            <option key={id || name} value={id || name}>
              {name}
            </option>
          );
        })}
      </select>
      {value && (
        <button
          type="button"
          onClick={() => updateParam(paramKey, "")}
          className="absolute right-6 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-red-500"
        >
          ✕
        </button>
      )}
    </div>
  );

  return (
    <div className="lg:w-[500px] xl:w-full space-y-4">
      {hasFilters && (
        <div className="flex items-center justify-between">
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear All Filters
          </button>
        </div>
      )}

      <Search
        searchParamKey="name"
        placeholder="Search watch name/title..."
        className="w-full"
        pathname={pathname}
      />

      {!!formattedBrands.length && (
        <FilterSelect
          options={formattedBrands}
          paramKey="brand"
          placeholder="Select Brand"
          value={filters.brand}
        />
      )}

      {!!formattedSubBrands.length && (
        <FilterSelect
          options={formattedSubBrands}
          paramKey="sub_brand"
          placeholder="Select Sub Brand"
          value={filters.subBrand}
        />
      )}

      {!!formattedSubCats.length && (
        <FilterSelect
          options={formattedSubCats}
          paramKey="sub_category"
          placeholder="Select Sub Category"
          value={filters.subCategory}
        />
      )}

      {!!formattedColors.length && (
        <FilterSelect
          options={formattedColors}
          paramKey="color"
          placeholder="Select Color"
          value={filters.color}
        />
      )}

      <FilterSelect
        options={["Male", "Female", "Unisex"] as const}
        paramKey="gender"
        placeholder="Select Gender"
        value={filters.gender}
      />
    </div>
  );
}
