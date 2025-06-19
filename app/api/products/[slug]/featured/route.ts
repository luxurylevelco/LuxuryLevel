import { r2 } from "@/lib/r2";
import { supabase } from "@/lib/supabase";
import {
  Brand,
  Category,
  FeaturedResponse,
  ProductResponse,
} from "@/lib/types";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";

// Function to get brand IDs, selecting only one sub-brand per parent brand
async function getAllBrandIds(
  supabase: typeof import("@/lib/supabase").supabase,
  brandIds: number[]
): Promise<number[]> {
  const allBrandIds = new Set<number>(brandIds);

  const { data: subBrands, error } = await supabase
    .from("brand")
    .select("id, parent_id")
    .in("parent_id", brandIds)
    .limit(1, { foreignTable: "parent_id" });

  if (error || !subBrands || subBrands.length === 0) {
    return Array.from(allBrandIds);
  }

  subBrands.forEach((subBrand) => {
    allBrandIds.add(subBrand.id);
  });

  return Array.from(allBrandIds);
}

// Function to get limited products per brand with hierarchy, ensuring no duplicates by name
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

  // Step 2: Fetch products for all brands in a single query
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

  // Step 3: Deduplicate products by name, keeping the first occurrence
  const seenNames = new Set<string>();
  const uniqueProducts = products.filter((product) => {
    if (seenNames.has(product.name)) {
      return false;
    }
    seenNames.add(product.name);
    return true;
  });

  // Step 4: Fetch brand names for all brand IDs
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

  // Step 5: Add brand names to unique products and apply total limit
  let productsWithBrandName = uniqueProducts
    .map((product) => ({
      ...product,
      brand_name: brandNameMap.get(product.brand_id) || "Unknown Brand",
    }))
    .slice(0, totalLimit); // Apply the total limit after deduplication

  // 4) Generate signed URLs for images in products
  if (productsWithBrandName) {
    const productsWithSignedUrls = await Promise.all(
      productsWithBrandName.map(async (product) => {
        const signedUrls = await Promise.all([
          product.image_1
            ? getSignedUrl(
                r2,
                new GetObjectCommand({
                  Bucket: process.env.R2_BUCKET_NAME,
                  Key: product.image_1,
                }),
                { expiresIn: 3600 } // 1 hour expiration
              )
            : null,
          product.image_2
            ? getSignedUrl(
                r2,
                new GetObjectCommand({
                  Bucket: process.env.R2_BUCKET_NAME,
                  Key: product.image_2,
                }),
                { expiresIn: 3600 }
              )
            : null,
          product.image_3
            ? getSignedUrl(
                r2,
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

    productsWithBrandName = productsWithSignedUrls;
  }

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
