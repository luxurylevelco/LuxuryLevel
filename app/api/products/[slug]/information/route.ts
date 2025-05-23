import { supabase } from "@/lib/supabase";
import { Product } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug: productId } = await params;

  // Fetch the main product
  const { data: product, error: productInfoError } = await supabase
    .from("product")
    .select("*")
    .eq("id", productId)
    .single();

  if (productInfoError || !product) {
    return NextResponse.json(
      { error: productInfoError?.message || `${productId} product not found.` },
      { status: 404 }
    );
  }

  // Fetch the product's brand
  const { data: brandData, error: brandError } = await supabase
    .from("brand")
    .select("*")
    .eq("id", product.brand_id)
    .single();

  if (brandError || !brandData) {
    return NextResponse.json(
      { error: brandError?.message || `Product brand not found.` },
      { status: 404 }
    );
  }

  // Use `let` so we can reassign
  let currentBrand = brandData;

  // Traverse up to find the root brand (the one without a parent_id)
  while (currentBrand?.parent_id) {
    const { data: parentBrand, error: parentError } = await supabase
      .from("brand")
      .select("*")
      .eq("id", currentBrand.parent_id)
      .single();

    if (parentError || !parentBrand) {
      return NextResponse.json(
        { error: parentError?.message || `Parent brand not found.` },
        { status: 404 }
      );
    }

    currentBrand = parentBrand;
  }

  const rootBrand = currentBrand;

  // Check for sub-brands under root brand
  const { data: subBrands, error: subBrandError } = await supabase
    .from("brand")
    .select("id")
    .eq("parent_id", rootBrand.id);

  let relatedProducts: Product[] = [];

  if (subBrandError) {
    return NextResponse.json({ error: subBrandError.message }, { status: 500 });
  }

  if (subBrands && subBrands.length > 0) {
    // Fetch from sub-brands
    const subBrandIds = subBrands.map((b) => b.id);
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
  } else {
    // Fetch from root brand (excluding current product)
    const { data: related, error: relatedError } = await supabase
      .from("product")
      .select("*")
      .eq("brand_id", rootBrand.id)
      .neq("id", product.id)
      .limit(6);

    if (relatedError) {
      return NextResponse.json(
        { error: relatedError.message },
        { status: 500 }
      );
    }

    relatedProducts = related || [];
  }

  return NextResponse.json({
    brandInfo: rootBrand,
    productInfo: product,
    relatedProducts,
  });
}
