// app/api/seed/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { data } from "@/lib/constants/bag-products";

//this api endpoint is subject to changes, some of the code implements dynamic checks like for brand field but some are not (didnt put direct code for every logic all).
//the reason is that there is only one bag brand available

export async function POST() {
  try {
    // 1. Insert unique brands (batch insert)
    const brands = {
      name: "HERMES",
      logo_url:
        "https://luxurysouq.com/wp-content/webp-express/webp-images/doc-root/wp-content/uploads/2023/07/HERMES-watches.png.webp",
      description: null,
    };

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
      .eq("name", "bags")
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
          console.warn(`Skipping product: missing brand or category`);
          return null;
        }

        // Clean PRICE

        // Map STOCK to integer: "In Stock" -> 1, else -> 0
        const stock = item.STOCK === "In Stock" ? 1 : 0;

        return {
          ref_no: null,
          name: item.TITLE,
          description: item.DESCRIPTION,
          color: item.COLOR,
          gender: item.GENDER,
          stock,
          price: null,
          brand_id: brandId,
          category_id: watchesCategoryId,
          image_1: item.IMAGE_1 || null,
          image_2: null,
          image_3: null,
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
