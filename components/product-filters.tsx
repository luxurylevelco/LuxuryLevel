"use client";

import { Brand, Category, ProductResponse } from "@/lib/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
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

  const toSentenceCase = useCallback(
    (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase(),
    []
  );

  const formattedColors = useMemo(
    () => availableColors?.map(toSentenceCase) || [],
    [availableColors, toSentenceCase]
  );

  const formattedSubCats = useMemo(
    () =>
      subCategoryList?.map((item) => ({
        id: toSentenceCase(item.name),
        name: toSentenceCase(item.name),
      })) || [],
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

  const [selectedValues, setSelectedValues] = useState({
    brand: "",
    subCategory: "",
    subBrand: "",
    color: "",
    gender: "",
  });

  // When searchParams are available, initialize state if empty
  useEffect(() => {
    setSelectedValues((prev) => ({
      brand: prev.brand || searchParams.get("brand") || "",
      subCategory: prev.subCategory || searchParams.get("subCategory") || "",
      subBrand: prev.subBrand || searchParams.get("subBrand") || "",
      color: prev.color || searchParams.get("color") || "",
      gender: prev.gender || searchParams.get("gender") || "",
    }));
  }, [searchParams]);

  const updateParam = useCallback(
    (key: keyof typeof selectedValues, value: string | null) => {
      const params = new URLSearchParams(searchParams);
      const newVal = value?.trim() || "";

      if (newVal) {
        params.set(key, newVal);
      } else {
        params.delete(key);
      }
      params.delete("page");

      // Update internal state
      setSelectedValues((prev) => ({
        ...prev,
        [key]: newVal,
      }));

      router.replace(`/${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const clearAllFilters = useCallback(() => {
    setSelectedValues({
      brand: "",
      subCategory: "",
      subBrand: "",
      color: "",
      gender: "",
    });
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  const hasActiveFilters = useMemo(
    () => Object.values(selectedValues).some((value) => value !== ""),
    [selectedValues]
  );

  return (
    <div className="w-full space-y-4">
      {hasActiveFilters && (
        <div className="flex justify-end">
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
        placeholder="Search product name"
        className="w-full"
        pathname={pathname}
      />

      <div className="flex flex-row flex-wrap xl:flex-col xl:flex-nowrap w-full gap-2">
        {[
          {
            label: "Brand",
            key: "brand",
            value: selectedValues.brand,
            options: formattedBrands,
          },
          {
            label: "Sub Brand",
            key: "subBrand",
            value: selectedValues.subBrand,
            options: formattedSubBrands,
          },
          {
            label: "Sub Category",
            key: "subCategory",
            value: selectedValues.subCategory,
            options: formattedSubCats,
          },
          {
            label: "Color",
            key: "color",
            value: selectedValues.color,
            options: formattedColors.map((color) => ({
              id: color,
              name: color,
            })),
          },
          {
            label: "Gender",
            key: "gender",
            value: selectedValues.gender,
            options: ["Male", "Female", "Unisex"].map((gender) => ({
              id: gender,
              name: gender,
            })),
          },
        ].map(({ label, key, value, options }) =>
          !!options.length ? (
            <div key={key} className="relative xl:w-full">
              <select
                className={`w-full rounded-full border px-4 py-2 text-sm appearance-none pr-10 ${
                  value
                    ? "border-gray-300 text-black"
                    : "border-gray-200 text-gray-400"
                }`}
                value={value}
                onChange={(e) =>
                  updateParam(
                    key as keyof typeof selectedValues,
                    e.target.value
                  )
                }
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
                  onClick={() =>
                    updateParam(key as keyof typeof selectedValues, "")
                  }
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-red-500"
                  aria-label={`Clear ${label} filter`}
                >
                  ✕
                </button>
              )}
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}
