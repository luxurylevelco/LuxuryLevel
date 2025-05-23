import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

async function getAllCategoryIds(rootId: number): Promise<number[]> {
  const ids: number[] = [rootId];
  const stack: number[] = [rootId];

  while (stack.length > 0) {
    const currentId = stack.pop();
    if (!currentId) continue; // Add safety check

    const { data: children, error } = await supabase
      .from("category")
      .select("id")
      .eq("parent_id", currentId);

    if (error) {
      console.error(
        `Error fetching children for category ${currentId}:`,
        error
      );
      continue;
    }

    if (children && children.length > 0) {
      for (const child of children) {
        if (child.id && !ids.includes(child.id)) {
          // Prevent duplicates
          ids.push(child.id);
          stack.push(child.id);
        }
      }
    }
  }

  console.log(`Found category IDs: ${ids}`); // Debug log
  return ids;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: categoryName } = await params;

    // Step 1: Get category by name
    const { data: category, error: categoryError } = await supabase
      .from("category")
      .select("id")
      .eq("name", categoryName)
      .single();

    if (categoryError || !category) {
      return NextResponse.json(
        { error: categoryError?.message || "Category not found." },
        { status: 404 }
      );
    }

    console.log(`Root category ID: ${category.id}`); // Debug log

    // Step 2: Get all nested category IDs
    const categoryIds = await getAllCategoryIds(category.id);

    // Step 3: Get distinct brand_ids from products in those categories
    // Use a more efficient approach with RPC call or increase limit significantly
    const { data: productBrands, error: productError } = await supabase
      .from("product")
      .select("brand_id")
      .in("category_id", categoryIds)
      .not("brand_id", "is", null)
      .limit(50000); // Set a much higher limit to handle large datasets

    if (productError) {
      console.error("Error fetching products:", productError);
      return NextResponse.json(
        { error: productError.message },
        { status: 500 }
      );
    }

    console.log(`Found ${productBrands?.length || 0} products with brands`); // Debug log

    // Create Set to get unique brand IDs, but be more explicit about filtering
    const brandIds = productBrands
      ? [
          ...new Set(
            productBrands
              .map((p) => p.brand_id)
              .filter((id): id is number => id !== null && id !== undefined)
          ),
        ]
      : [];

    console.log(`Unique brand IDs: ${brandIds}`); // Debug log

    if (brandIds.length === 0) {
      return NextResponse.json([]);
    }

    // Step 4: Get brand details
    const { data: brands, error: brandError } = await supabase
      .from("brand")
      .select("id, name, description, logo_url")
      .in("id", brandIds)
      .order("name"); // Add ordering for consistency

    if (brandError) {
      console.error("Error fetching brands:", brandError);
      return NextResponse.json({ error: brandError.message }, { status: 500 });
    }

    console.log(`Returning ${brands?.length || 0} brands`); // Debug log
    return NextResponse.json(brands || []);
  } catch (error) {
    console.error("Unexpected error in GET handler:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
