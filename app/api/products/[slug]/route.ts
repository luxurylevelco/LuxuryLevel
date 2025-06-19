import { supabase } from "@/lib/supabase";
import { Product } from "@/lib/types";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";
import { r2 as r2Client } from "@/lib/r2";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug: categoryName } = await params;
  const { searchParams } = new URL(req.url);

  const page = parseInt(searchParams.get("page") || "1", 10);
  const noOfItems = parseInt(searchParams.get("noOfItems") || "10", 10);
  const filterColor = searchParams.get("color");
  const filterGender = searchParams.get("gender");
  const filterName = searchParams.get("name");
  const filterBrand = searchParams.get("brand");

  // 1) Look up root category
  const { data: category, error: catErr } = await supabase
    .from("category")
    .select("id")
    .ilike("name", `%${categoryName}%`)
    .single();
  if (catErr || !category) {
    return NextResponse.json(
      { error: `${categoryName} not found` },
      { status: 404 }
    );
  }

  // 2) Fetch subBrands + build brandIds[]
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

    // 2a) Fetch main+child brands
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

    // 2b) Pick sub-brands
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

  // 3) RPC call
  const { data: rpcData, error: rpcErr } = await supabase.rpc(
    "get_filtered_products_with_category",
    {
      p_root_category_id: category ? [category.id] : null, // Pass as array per function definition
      p_filter_brand_ids: brandIds.length ? brandIds : null,
      p_filter_color: filterColor || null,
      p_filter_gender: filterGender || null,
      p_filter_name: filterName || null,
      p_page_number: page,
      p_items_per_page: noOfItems,
    }
  );

  if (rpcErr) {
    return NextResponse.json({ error: rpcErr.message }, { status: 500 });
  }

  // Log the raw RPC data to debug structure
  console.log("Raw RPC Data:", JSON.stringify(rpcData, null, 2));

  // 4) Generate signed URLs for images in products
  if (rpcData && rpcData.products) {
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

  // 5) Override subBrands with computed one
  if (rpcData) {
    rpcData.subBrands = subBrands;
  }

  // 6) Return the response
  return NextResponse.json(rpcData || {});
}
