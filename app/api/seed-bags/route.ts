// app/api/seed-bags/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { data } from "@/lib/constants/bag-products";
import path from "path";
import fs from "fs/promises";
import { findImagePath, uploadImageToR2 } from "@/lib/r2";

const BAGS_DIR = path.join(process.cwd(), "public", "products", "bags");

export async function POST() {
  try {
    console.log(`Looking for bags directory ${BAGS_DIR}`);

    const bagsDirExists = await fs
      .access(BAGS_DIR)
      .then(() => true)
      .catch(() => false);

    if (!bagsDirExists) {
      return NextResponse.json(
        { error: `Bags directory not found: ${BAGS_DIR}` },
        { status: 400 }
      );
    }

    const bagsFolders = await fs.readdir(BAGS_DIR);
    console.log("Available folders in watches directory:", bagsFolders);

    // // 1. Insert unique brands (batch insert)
    // const brands = {
    //   name: "HERMES",
    //   logo_url:
    //     "https://luxurysouq.com/wp-content/webp-express/webp-images/doc-root/wp-content/uploads/2023/07/HERMES-watches.png.webp",
    //   description: null,
    // };

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

    // 3. Fetch brand ids and category ID
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
            "Category not found",
        },
        { status: 500 }
      );
    }

    const brandMap = new Map(brandsData?.map((b) => [b.name, b.id]));
    const watchesCategoryId = categoryData.id;

    // 4. Insert products (batch insert, all as "bags")
    const products = await Promise.all(
      data
        .map(async (item, index) => {
          console.log(`\n--- Processing item ${index + 1} ---`);
          console.log(`IMG_ID: ${item.IMG_ID}, Brand: ${item.BRAND}`);

          const brandId = brandMap.get(item.BRAND);
          if (!brandId || !watchesCategoryId) {
            console.warn(`Skipping product: missing brand or category`);
            return null;
          }

          const folderPath = path.join(BAGS_DIR, String(item.IMG_ID));

          const imagePaths = await Promise.all([
            findImagePath(folderPath, "1"),
            findImagePath(folderPath, "2"),
            findImagePath(folderPath, "3"),
          ]);

          const uploadedKeys = await Promise.all(
            imagePaths.map((imgPath, idx) =>
              imgPath
                ? uploadImageToR2(
                    imgPath,
                    `bags/${item.IMG_ID}_${idx + 1}${path.extname(imgPath)}`
                  )
                : null
            )
          );

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
            image_1: uploadedKeys[0],
            image_2: uploadedKeys[1],
            image_3: uploadedKeys[2],
          };
        })
        .filter((p): p is NonNullable<typeof p> => p !== null)
    );

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
