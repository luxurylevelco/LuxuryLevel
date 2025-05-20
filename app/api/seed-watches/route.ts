// app/api/seed/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { data } from "@/lib/constants/watch-products";

export async function POST() {
  try {
    // 1. Insert categories (only "watches")
    const categories = [
      { name: "watches", description: "" },
      { name: "jewelry", description: "" },
      { name: "bags", description: "" },
    ];
    const { error: categoryError } = await supabase
      .from("category")
      .upsert(categories, { onConflict: "name" });

    if (categoryError) {
      console.error("Error inserting categories:", categoryError);
      return NextResponse.json(
        { error: "Failed to seed categories", details: categoryError.message },
        { status: 500 }
      );
    }

    // 2. Insert unique brands (batch insert)
    const brandSet = new Set(data.map((item) => item.BRAND));
    const brands = Array.from(brandSet).map((brand) => {
      const brandObj = data.find((i) => i.BRAND === brand);
      return {
        name: brand,
        logo_url: brandObj?.BRAND_IMAGE ?? null,
        description: null,
      };
    });
    const { error: brandError } = await supabase
      .from("brand")
      .upsert(brands, { onConflict: "name" });

    if (brandError) {
      console.error("Error inserting brands:", brandError);
      return NextResponse.json(
        { error: "Failed to seed brands", details: brandError.message },
        { status: 500 }
      );
    }

    // 3. Fetch brand and category IDs
    const { data: brandsData, error: brandsFetchError } = await supabase
      .from("brand")
      .select("id, name");
    const { data: categoryData, error: categoryFetchError } = await supabase
      .from("category")
      .select("id, name")
      .eq("name", "watches")
      .single();

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
    const watchesCategoryId = categoryData.id;

    // 4. Insert products (batch insert, all as "watches")
    const products = data
      .map((item) => {
        const brandId = brandMap.get(item.BRAND);
        if (!brandId || !watchesCategoryId) {
          console.warn(
            `Skipping product ${item.ID}: missing brand or category`
          );
          return null;
        }

        // Clean PRICE
        const price = parseFloat(item.PRICE.replace(/,/g, ""));
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
          category_id: watchesCategoryId,
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
