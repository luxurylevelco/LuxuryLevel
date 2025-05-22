import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// Types
interface Brand {
  id: number;
}

interface Product {
  id: number;
  ref_no: string | null;
  name: string;
  description: string | null;
  color: string | null;
  gender: string | null;
  stock: number | null;
  price: number | null;
  image_1: string | null;
  image_2: string | null;
  image_3: string | null;
  created_at: string;
  updated_at: string;
  category_id: number | null;
  brand_id: number;
  brand_name: string | null;
}

interface Category {
  id: number;
}

// Function to get brand IDs, selecting only one sub-brand per parent brand
async function getAllBrandIds(
  supabase: typeof import("@/lib/supabase").supabase,
  brandIds: number[]
): Promise<number[]> {
  const allBrandIds = new Set<number>(brandIds);

  // Fetch one sub-brand per parent brand
  const { data: subBrands, error } = await supabase
    .from("brand")
    .select("id, parent_id")
    .in("parent_id", brandIds)
    .limit(1, { foreignTable: "parent_id" }); // Limit to one sub-brand per parent

  if (error || !subBrands || subBrands.length === 0) {
    return Array.from(allBrandIds);
  }

  // Add the single sub-brand IDs to the set
  subBrands.forEach((subBrand: Brand & { parent_id: number }) => {
    allBrandIds.add(subBrand.id);
  });

  return Array.from(allBrandIds);
}

// Function to get limited products per brand with hierarchy
async function getLimitedProductsWithHierarchy(
  supabase: typeof import("@/lib/supabase").supabase,
  brandIds: number[],
  categoryId: number,
  limitPerBrand: number
): Promise<Product[]> {
  // Step 1: Get brand IDs, including one sub-brand per brand
  const allBrandIds: number[] = await getAllBrandIds(supabase, brandIds);

  if (allBrandIds.length === 0) {
    return [];
  }

  // Step 2: Get products for all brands, filtered by category
  const results: Product[] = [];

  for (const brandId of allBrandIds) {
    const { data: products, error } = await supabase
      .from("product")
      .select("*")
      .eq("brand_id", brandId)
      .eq("category_id", categoryId)
      .order("created_at", { ascending: false })
      .limit(limitPerBrand);

    if (error) {
      console.error(`Error fetching products for brand ${brandId}:`, error);
      continue;
    }

    const { data: brandName, error: brandNameError } = await supabase
      .from("brand")
      .select("name")
      .eq("id", brandId)
      .single();

    if (brandNameError) {
      console.error(`Error fetching brand name for brand ${brandId}:`, error);
      continue;
    }

    if (products && products.length > 0) {
      const productsWithBrandName = products.map((product: Product) => ({
        ...product,
        brand_name: brandName.name,
      }));
      results.push(...productsWithBrandName);
    }
  }

  return results;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  try {
    const { slug: categoryName } = await params;
    const { searchParams } = new URL(req.url);

    const limit = searchParams.get("limit");

    // Get category ID
    const { data: categoryData, error: categoryIdError } = await supabase
      .from("category")
      .select("id")
      .ilike("name", `%${categoryName}%`)
      .single();

    if (categoryIdError || !categoryData) {
      return NextResponse.json(
        {
          error:
            categoryIdError?.message || `Category '${categoryName}' not found.`,
        },
        { status: 404 }
      );
    }

    const categoryId = (categoryData as Category).id;

    // Get the featured brand ids
    const { data: brandData, error: brandIdsError } = await supabase
      .from("brand")
      .select("id")
      .eq("featured", true);

    if (brandIdsError || !brandData || brandData.length === 0) {
      return NextResponse.json(
        {
          error: brandIdsError?.message || "No featured brands found.",
        },
        { status: 404 }
      );
    }

    const featuredBrandIds: number[] = (brandData as Brand[]).map(
      (brand) => brand.id
    );

    // Get products with hierarchy support
    const products: Product[] = await getLimitedProductsWithHierarchy(
      supabase,
      featuredBrandIds,
      categoryId,
      limit ? Number(limit) : 2 // limit_per_brand
    );

    console.log("Featured brand IDs:", featuredBrandIds);
    console.log(
      "All brand IDs (including one sub-brand per brand):",
      await getAllBrandIds(supabase, featuredBrandIds)
    );
    console.log("Products found:", products?.length || 0);

    return NextResponse.json({
      products,
      totalProducts: products?.length || 0,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
