import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug: productId } = await params;

  //get product information
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

  //get product brand information
  const { data: productBrand, error: productBrandError } = await supabase
    .from("brand")
    .select("*")
    .eq("id", product.brand_id)
    .single();

  if (productBrandError || !productBrand) {
    return NextResponse.json(
      { error: productBrandError?.message || `Product Brand not found.` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    brandInfo: productBrand,
    productInfo: product,
  });
}
