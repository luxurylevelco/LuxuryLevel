// app/api/brands/[brandId]/route.ts
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  const { brandId: _brandId } = await params;
  const brandId = parseInt(_brandId);
  const { searchParams } = new URL(req.url);

  const page = parseInt(searchParams.get("page") || "1");
  const noOfItems = parseInt(searchParams.get("noOfItems") || "10");
  const from = (page - 1) * noOfItems;
  const to = from + noOfItems - 1;

  if (isNaN(brandId)) {
    return NextResponse.json({ error: "Invalid brandId" }, { status: 400 });
  }

  // Count total number of products
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
    .select("*")
    .eq("brand_id", brandId)
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    products,
    page: {
      current: page,
      total: totalPages,
    },
  });
}
