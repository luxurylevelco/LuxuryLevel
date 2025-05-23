import { supabase } from "@/lib/supabase";
import { Product, Brand } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

// Recursively get the root brand
function findRootBrand(
  brandId: string,
  brandMap: Map<string, Brand>
): Brand | null {
  let current = brandMap.get(brandId);
  while (current?.parent_id) {
    current = brandMap.get(current.parent_id);
  }
  return current || null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const productId = params.slug;

  // Fetch product
  const { data: product, error: productError } = await supabase
    .from("product")
    .select("*")
    .eq("id", productId)
    .single();

  if (productError || !product) {
    return NextResponse.json(
      { error: productError?.message || `Product ${productId} not found.` },
      { status: 404 }
    );
  }

  // Fetch all brands (so we can build relationships in-memory)
  const { data: allBrands, error: brandFetchError } = await supabase
    .from("brand")
    .select("*");

  if (brandFetchError || !allBrands) {
    return NextResponse.json(
      { error: brandFetchError?.message || `Failed to fetch brands.` },
      { status: 500 }
    );
  }

  const brandMap = new Map<string, Brand>(allBrands.map((b) => [b.id, b]));

  // Get root brand
  const rootBrand = findRootBrand(product.brand_id, brandMap);
  if (!rootBrand) {
    return NextResponse.json(
      { error: "Root brand not found." },
      { status: 404 }
    );
  }

  // Get sub-brand IDs (children of rootBrand)
  const subBrandIds = allBrands
    .filter((b) => b.parent_id === rootBrand.id)
    .map((b) => b.id);

  let relatedProducts: Product[] = [];

  if (subBrandIds.length > 0) {
    // Fetch products from sub-brands
    const { data: related, error: relatedError } = await supabase
      .from("product")
      .select("*")
      .in("brand_id", subBrandIds)
      .limit(6);

    if (relatedError) {
      return NextResponse.json(
        { error: relatedError.message },
        { status: 500 }
      );
    }

    relatedProducts = related || [];
  }

  // If no sub-brand products, fallback to root brand's other products
  if (relatedProducts.length === 0) {
    const { data: fallback, error: fallbackError } = await supabase
      .from("product")
      .select("*")
      .eq("brand_id", rootBrand.id)
      .neq("id", product.id)
      .limit(6);

    if (fallbackError) {
      return NextResponse.json(
        { error: fallbackError.message },
        { status: 500 }
      );
    }

    relatedProducts = fallback || [];
  }

  return NextResponse.json({
    brandInfo: rootBrand,
    productInfo: product,
    relatedProducts,
  });
}
