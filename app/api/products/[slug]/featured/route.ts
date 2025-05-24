import { supabase } from "@/lib/supabase";
import {
  Brand,
  Category,
  FeaturedResponse,
  ProductResponse,
} from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

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
  subBrands.forEach((subBrand) => {
    allBrandIds.add(subBrand.id);
  });

  return Array.from(allBrandIds);
}

// Function to get limited products per brand with hierarchy
async function getLimitedProductsWithHierarchy(
  supabase: typeof import("@/lib/supabase").supabase,
  brandIds: number[],
  categoryId: number,
  totalLimit: number
): Promise<ProductResponse["products"]> {
  // Step 1: Get brand IDs, including one sub-brand per brand
  const allBrandIds: number[] = await getAllBrandIds(supabase, brandIds);

  if (allBrandIds.length === 0) {
    return [];
  }

  // Fetch products for all brands in a single query
  const { data: products, error } = await supabase
    .from("product")
    .select("id, name, price, image_1, image_2, image_3, brand_id")
    .in("brand_id", allBrandIds)
    .eq("category_id", categoryId)
    .order("created_at", { ascending: false });

  if (error || !products || products.length === 0) {
    console.error("Error fetching products:", error);
    return [];
  }

  // Step 3: Fetch brand names for all brand IDs
  const { data: brands, error: brandsError } = await supabase
    .from("brand")
    .select("id, name")
    .in("id", allBrandIds);

  if (brandsError || !brands) {
    console.error("Error fetching brand names:", brandsError);
    return [];
  }

  // Create a map of brand ID to brand name for efficient lookup
  const brandNameMap = new Map<number, string>(
    brands.map((brand: { id: number; name: string }) => [brand.id, brand.name])
  );

  // Step 4: Add brand names to products and apply total limit
  const productsWithBrandName = products
    .map((product) => ({
      ...product,
      brand_name: brandNameMap.get(product.brand_id) || "Unknown Brand",
    }))
    .slice(0, totalLimit); // Apply the total limit here

  return productsWithBrandName;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  try {
    const { slug: categoryName } = await params;
    const { searchParams } = new URL(req.url);

    const limit = searchParams.get("limit");
    const brandQuery = searchParams.get("brand");

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

    let featuredBrandIds: number[] = [];
    let brandInfo: FeaturedResponse["brandInfo"] = undefined;
    if (brandQuery) {
      // Get the specific brand by name
      const { data: brandData, error: brandError } = await supabase
        .from("brand")
        .select("id, logo_url, featured")
        .ilike("name", `%${brandQuery}%`)
        .single();

      if (brandError || !brandData) {
        return NextResponse.json(
          {
            error: brandError?.message || `Brand '${brandQuery}' not found.`,
          },
          { status: 404 }
        );
      }

      if (!brandData.featured) {
        return NextResponse.json(
          {
            error: `Brand '${brandQuery}' is not featured.`,
          },
          { status: 400 }
        );
      }
      brandInfo = brandData;
      featuredBrandIds = [brandData.id];
    } else {
      // Default: get all featured brands
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

      featuredBrandIds = (brandData as Brand[]).map((brand) => brand.id);
    }

    // Get products with hierarchy support
    const products: ProductResponse["products"] =
      await getLimitedProductsWithHierarchy(
        supabase,
        featuredBrandIds,
        categoryId,
        limit ? Number(limit) : 2
      );

    return NextResponse.json({
      ...(brandInfo ? { brandInfo } : {}),
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
