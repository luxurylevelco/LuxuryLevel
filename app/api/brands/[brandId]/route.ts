// app/api/brands/[brandId]/route.ts
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  const { brandId } = await params;

  const _brandId = parseInt(brandId);

  if (isNaN(_brandId)) {
    return null;
  }

  const { searchParams } = new URL(req.url);

  const { data: brandDetails, error: brandDetailsError } = await supabase
    .from("brand")
    .select("*")
    .eq("id", _brandId)
    .single(); // Ensures only one row is returned

  if (brandDetailsError) {
    return NextResponse.json(
      { error: brandDetailsError.message },
      { status: 500 }
    );
  }

  const page = parseInt(searchParams.get("page") || "1");
  const noOfItems = parseInt(searchParams.get("noOfItems") || "10");
  const from = (page - 1) * noOfItems;
  const to = from + noOfItems - 1;

  if (isNaN(_brandId)) {
    return NextResponse.json({ error: "Invalid brandId" }, { status: 400 });
  }

  // Get total count of products with this brand_id
  const { count, error: countError } = await supabase
    .from("product")
    .select("*", { count: "exact", head: true })
    .eq("brand_id", brandId);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  const totalPages = Math.ceil((count || 0) / noOfItems);

  // Fetch paginated products
  const { data: products, error } = await supabase
    .from("product")
    .select(
      `
      id,
      ref_no,
      name,
      description,
      color,
      gender,
      stock,
      price,
      image_1,
      image_2,
      image_3,
      created_at,
      updated_at
    `
    )
    .eq("brand_id", brandId)
    .range(from, to)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    brandDetails,
    products,
    page: {
      current: page,
      total: totalPages,
    },
  });
}
