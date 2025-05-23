// app/api/seed-jewelries/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { data } from "@/lib/constants/jewelry-products";

export async function POST() {
  try {
    // // 1. Insert categories (only "jewelry categories")
    // const uniqueJewelryCategories = uniqueByKey(data, "JEWELRY_CATEGORY").map(
    //   (categories) => categories.JEWELRY_CATEGORY
    // );

    // const { data: parentCategoryData } = await supabase
    //   .from("category")
    //   .select("id")
    //   .eq("name", "jewelry")
    //   .single();

    // const jewelryCategoriesMap = uniqueJewelryCategories.map((uniqueCat) => {
    //   return {
    //     name: uniqueCat,
    //     description: "",
    //     parent_id: parentCategoryData?.id,
    //   };
    // });

    // const { error: categoryError } = await supabase
    //   .from("category")
    //   .upsert(jewelryCategoriesMap, { onConflict: "name" });

    // if (categoryError) {
    //   console.error("Error inserting jewelry  categories:", categoryError);
    //   return NextResponse.json(
    //     { error: "Failed to seed categories", details: categoryError.message },
    //     { status: 500 }
    //   );
    // }

    // // 2. Insert unique brands (batch insert)
    // const brandSet = new Set(data.map((item) => item.BRAND));
    // const brands = Array.from(brandSet).map((brand) => {
    //   const brandObj = data.find((i) => i.BRAND === brand);
    //   return {
    //     name: brand,
    //     logo_url: brandObj?.BRAND_IMAGE ?? null,
    //     description: null,
    //   };
    // });
    // const { error: brandError } = await supabase
    //   .from("brand")
    //   .upsert(brands, { onConflict: "name" });

    // if (brandError) {
    //   console.error("Error inserting brands:", brandError);
    //   return NextResponse.json(
    //     { error: "Failed to seed brands", details: brandError.message },
    //     { status: 500 }
    //   );
    // }

    // 3. Fetch brand and category IDs
    const { data: brandsData, error: brandsFetchError } = await supabase
      .from("brand")
      .select("id, name");

    //fetch categories
    const { data: categoryData, error: categoryFetchError } = await supabase
      .from("category")
      .select("id, name");

    if (brandsFetchError || categoryFetchError || !categoryData) {
      console.error(
        "Error fetching IDs:",
        brandsFetchError || categoryFetchError
      );
      return NextResponse.json(
        {
          error: "Failed to fetch IDs",
          details:
            (brandsFetchError || categoryFetchError)?.message ||
            "Category 'watches' not found",
        },
        { status: 500 }
      );
    }

    const brandMap = new Map(brandsData?.map((b) => [b.name, b.id]));
    const jewelryCategoryMap = new Map(
      categoryData?.map((b) => [b.name, b.id])
    );

    // 4. Insert products (batch insert, all as "watches")
    const products = data
      .map((item) => {
        const brandId = brandMap.get(item.BRAND);
        const jewelryCategoryId = jewelryCategoryMap.get(item.JEWELRY_CATEGORY);
        if (!brandId || !jewelryCategoryId) {
          console.warn(`Skipping product : missing brand or category`);
          return null;
        }

        const price = typeof item.PRICE === "number" ? item.PRICE : 0; // or null, depending on your needs
        // Map STOCK to integer: "In Stock" -> 1, else -> 0
        const stock = item.STOCK === "In Stock" ? 1 : 0;

        return {
          ref_no: String(item.REF_NO),
          name: item.TITLE,
          description: item.DESCRIPTION,
          color: item.COLOR,
          gender: item.GENDER,
          stock,
          price: price ? parseFloat(price.toFixed(2)) : null,
          brand_id: brandId,
          category_id: jewelryCategoryId,
          image_1: item.IMAGE_1 || null,
          image_2: item.IMAGE_2 || null,
          image_3: item.IMAGE_3 || null,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    if (products.length === 0) {
      return NextResponse.json(
        { error: "No valid products to seed" },
        { status: 400 }
      );
    }

    // Insert in chunks
    const chunkSize = 500;
    for (let i = 0; i < products.length; i += chunkSize) {
      const chunk = products.slice(i, i + chunkSize);
      const { error: productError } = await supabase
        .from("product")
        .insert(chunk);

      if (productError) {
        console.error("Error inserting products:", productError);
        return NextResponse.json(
          { error: "Failed to seed products", details: productError.message },
          { status: 500 }
        );
      }
    }
    return NextResponse.json({
      status: "success",
      initialDataLength: data.length,
      seededProducts: products.length,
    });
  } catch (err) {
    console.error("Seeding error:", err);
    return NextResponse.json(
      { error: "Seeding failed", details: (err as Error).message },
      { status: 500 }
    );
  }
}
