import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 as r2Client } from "@/lib/r2";
import { Product } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const page = parseInt(searchParams.get("page") || "1", 10);
  const noOfItems = parseInt(searchParams.get("noOfItems") || "10", 10);

  // filters
  const filterColor = searchParams.get("color");
  const filterGender = searchParams.get("gender");
  const filterName = searchParams.get("name");
  const filterBrand = searchParams.get("brand");

  // 1) Fetch subBrands + build brandIds[]
  let brandIds: number[] = [];
  let subBrands: { id: number; name: string }[] = [];

  if (filterBrand) {
    const bid = parseInt(filterBrand, 10);
    if (isNaN(bid)) {
      return NextResponse.json(
        { error: `Invalid brand ID: ${filterBrand}` },
        { status: 400 }
      );
    }

    // 1a) Fetch main+child brands
    const { data: brands, error: be } = await supabase
      .from("brand")
      .select("id, name, parent_id")
      .or(`id.eq.${bid},parent_id.eq.${bid}`);
    if (be) {
      return NextResponse.json({ error: be.message }, { status: 500 });
    }
    if (!brands?.length) {
      return NextResponse.json(
        { error: `Brand ${bid} not found` },
        { status: 404 }
      );
    }

    brandIds = brands.map((b) => b.id);

    // 1b) Pick sub‐brands
    const main = brands.find((b) => b.id === bid)!;
    if (main.parent_id) {
      const { data: sibs, error: se } = await supabase
        .from("brand")
        .select("id, name")
        .eq("parent_id", main.parent_id);
      if (se) return NextResponse.json({ error: se.message }, { status: 500 });
      subBrands = sibs!;
    } else {
      subBrands = brands.filter((b) => b.id !== main.id);
    }
  }

  // 2) Single RPC call
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "get_filtered_products_with_category",
    {
      p_root_category_id: null, // array of one
      p_filter_brand_ids: brandIds.length ? brandIds : null,
      p_filter_color: filterColor || null,
      p_filter_gender: filterGender || null,
      p_filter_name: filterName || null,
      p_page_number: page,
      p_items_per_page: noOfItems,
    }
  );

  if (rpcError) {
    return NextResponse.json({ error: rpcError.message }, { status: 500 });
  }

  // 3) Generate signed URLs for images in products
  if (rpcData.products) {
    const productsWithSignedUrls = await Promise.all(
      rpcData.products.map(async (product: Product) => {
        const signedUrls = await Promise.all([
          product.image_1
            ? getSignedUrl(
                r2Client,
                new GetObjectCommand({
                  Bucket: process.env.R2_BUCKET_NAME,
                  Key: product.image_1,
                }),
                { expiresIn: 3600 } // 1 hour expiration
              )
            : null,
          product.image_2
            ? getSignedUrl(
                r2Client,
                new GetObjectCommand({
                  Bucket: process.env.R2_BUCKET_NAME,
                  Key: product.image_2,
                }),
                { expiresIn: 3600 }
              )
            : null,
          product.image_3
            ? getSignedUrl(
                r2Client,
                new GetObjectCommand({
                  Bucket: process.env.R2_BUCKET_NAME,
                  Key: product.image_3,
                }),
                { expiresIn: 3600 }
              )
            : null,
        ]);

        return {
          ...product,
          image_1: signedUrls[0],
          image_2: signedUrls[1],
          image_3: signedUrls[2],
        };
      })
    );

    rpcData.products = productsWithSignedUrls;
  }

  // 4) Override subBrands with computed one
  rpcData.subBrands = subBrands;

  return NextResponse.json(rpcData);
}
