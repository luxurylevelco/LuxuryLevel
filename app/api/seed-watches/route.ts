// app/api/seed-watches/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { data } from "@/lib/constants/watch-products";
import fs from "fs/promises";
import path from "path";
import { findImagePath, uploadImageToR2 } from "@/lib/r2";

// Fixed: Added 'public' to the path
const WATCHES_DIR = path.join(process.cwd(), "public", "products", "watches");

export async function POST() {
  try {
    console.log(`Looking for watches in: ${WATCHES_DIR}`);

    const watchesDirExists = await fs
      .access(WATCHES_DIR)
      .then(() => true)
      .catch(() => false);
    if (!watchesDirExists) {
      return NextResponse.json(
        { error: `Watches directory not found: ${WATCHES_DIR}` },
        { status: 400 }
      );
    }

    const watchesFolders = await fs.readdir(WATCHES_DIR);
    console.log("Available folders in watches directory:", watchesFolders);

    const { data: brandsData, error: brandsFetchError } = await supabase
      .from("brand")
      .select("id, name");

    const { data: categoryData, error: categoryFetchError } = await supabase
      .from("category")
      .select("id, name")
      .eq("name", "watches")
      .single();

    if (brandsFetchError || categoryFetchError || !categoryData) {
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

    const brandMap = new Map(brandsData.map((b) => [b.name, b.id]));
    const watchesCategoryId = categoryData.id;

    const products = await Promise.all(
      data.map(async (item, index) => {
        console.log(`\n--- Processing item ${index + 1} ---`);
        console.log(`IMG_ID: ${item.IMG_ID}, Brand: ${item.BRAND}`);

        const brandId = brandMap.get(item.BRAND);
        if (!brandId || !watchesCategoryId) {
          console.log(
            `Skipping item: brandId=${brandId}, watchesCategoryId=${watchesCategoryId}`
          );
          return null;
        }

        const folderPath = path.join(WATCHES_DIR, String(item.IMG_ID));
        console.log(`Looking for images in: ${folderPath}`);

        const imagePaths = await Promise.all([
          findImagePath(folderPath, "1"),
          findImagePath(folderPath, "2"),
          findImagePath(folderPath, "3"),
        ]);

        console.log(`Found image paths:`, imagePaths);

        const uploadedKeys = await Promise.all(
          imagePaths.map((imgPath, idx) =>
            imgPath
              ? uploadImageToR2(
                  imgPath,
                  `watches/${item.IMG_ID}_${idx + 1}${path.extname(imgPath)}`
                )
              : null
          )
        );

        console.log(`Uploaded keys:`, uploadedKeys);

        const price = parseFloat(String(item.PRICE).replace(/,/g, ""));
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
          image_1: uploadedKeys[0],
          image_2: uploadedKeys[1],
          image_3: uploadedKeys[2],
        };
      })
    );

    const filteredProducts = products.filter(
      (p): p is NonNullable<typeof p> => p !== null
    );

    if (filteredProducts.length === 0) {
      return NextResponse.json(
        { error: "No valid products to seed" },
        { status: 400 }
      );
    }

    const chunkSize = 500;
    for (let i = 0; i < filteredProducts.length; i += chunkSize) {
      const chunk = filteredProducts.slice(i, i + chunkSize);
      const { error: productError } = await supabase
        .from("product")
        .insert(chunk);

      if (productError) {
        return NextResponse.json(
          { error: "Failed to seed products", details: productError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      status: "success",
      initialDataLength: data.length,
      seededProducts: filteredProducts.length,
    });
  } catch (err) {
    console.error("Seeding error:", err);
    return NextResponse.json(
      { error: "Seeding failed", details: (err as Error).message },
      { status: 500 }
    );
  }
}
