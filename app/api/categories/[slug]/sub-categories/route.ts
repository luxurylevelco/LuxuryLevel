import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug: categoryName } = await params;

  // Step 1: Get the ID of the category
  const { data: parentCategory, error: parentError } = await supabase
    .from("category")
    .select("id")
    .eq("name", categoryName)
    .single();

  if (parentError || !parentCategory) {
    return NextResponse.json(
      { error: "Jewelry category not found" },
      { status: 404 }
    );
  }

  // Step 2: Get subcategories with that parent_id
  const { data: subcategories, error } = await supabase
    .from("category")
    .select("id, name")
    .eq("parent_id", parentCategory.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(subcategories);
}
