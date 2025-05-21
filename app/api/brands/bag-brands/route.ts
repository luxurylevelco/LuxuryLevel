// app/api/bags-brands/route.ts
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  // Step 1: Get the "bags" category ID
  const { data: category, error: categoryError } = await supabase
    .from("category")
    .select("id")
    .eq("name", "bags")
    .single();

  if (categoryError || !category) {
    return NextResponse.json(
      { error: categoryError?.message || "Bags category not found." },
      { status: 500 }
    );
  }

  // Step 2: Get distinct brand_ids from products in that category
  const { data: productBrands, error: productError } = await supabase
    .from("product")
    .select("brand_id")
    .eq("category_id", category.id);

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  const brandIds = [...new Set(productBrands.map((p) => p.brand_id))];

  if (brandIds.length === 0) {
    return NextResponse.json([]);
  }

  // Step 3: Get full brand info
  const { data: brands, error: brandError } = await supabase
    .from("brand")
    .select("id, name, description, logo_url")
    .in("id", brandIds);

  if (brandError) {
    return NextResponse.json({ error: brandError.message }, { status: 500 });
  }

  // Step 4: Return raw array of brand objects (no key wrapping)
  return NextResponse.json(brands);
}
