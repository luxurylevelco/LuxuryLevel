// app/api/bags-brands/route.ts
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  // Step 1: Get the ID of the "bags" category
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

  const bagsCategoryId = category.id;

  // Step 2: Get all distinct brand_ids from products where category_id matches
  const { data: productBrands, error: productError } = await supabase
    .from("product")
    .select("brand_id")
    .eq("category_id", bagsCategoryId);

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  const brandIds = [
    ...new Set(productBrands.map((product) => product.brand_id)),
  ]; // remove duplicates

  if (brandIds.length === 0) {
    return NextResponse.json({ brands: [] });
  }

  // Step 3: Fetch brand names from brand table
  const { data: brands, error: brandError } = await supabase
    .from("brand")
    .select("id, name")
    .in("id", brandIds);

  if (brandError) {
    return NextResponse.json({ error: brandError.message }, { status: 500 });
  }

  return NextResponse.json({ brands });
}
