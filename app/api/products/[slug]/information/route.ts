import { r2 } from "@/lib/r2";
import { supabase } from "@/lib/supabase";
import { Product, Brand } from "@/lib/types";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug: productId } = await params;

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

  // convert image keys to signed images urls
  let productInfoWithSignedUrls = {};
  if (product) {
    const [img1, img2, img3] = await Promise.all([
      product.image_1
        ? getSignedUrl(
            r2,
            new GetObjectCommand({
              Bucket: process.env.R2_BUCKET_NAME,
              Key: product.image_1,
            })
          )
        : null,
      product.image_2
        ? getSignedUrl(
            r2,
            new GetObjectCommand({
              Bucket: process.env.R2_BUCKET_NAME,
              Key: product.image_2,
            })
          )
        : null,
      product.image_3
        ? getSignedUrl(
            r2,
            new GetObjectCommand({
              Bucket: process.env.R2_BUCKET_NAME,
              Key: product.image_3,
            })
          )
        : null,
    ]);
    productInfoWithSignedUrls = {
      ...product,
      image_1: img1,
      image_2: img2,
      image_3: img3,
    };
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

  if (relatedProducts) {
    const productsWithSignedUrls = await Promise.all(
      relatedProducts.map(async (product: Product) => {
        const signedUrls = await Promise.all([
          product.image_1
            ? getSignedUrl(
                r2,
                new GetObjectCommand({
                  Bucket: process.env.R2_BUCKET_NAME,
                  Key: product.image_1,
                })
              )
            : null,
          product.image_2
            ? getSignedUrl(
                r2,
                new GetObjectCommand({
                  Bucket: process.env.R2_BUCKET_NAME,
                  Key: product.image_2,
                })
              )
            : null,
          product.image_3
            ? getSignedUrl(
                r2,
                new GetObjectCommand({
                  Bucket: process.env.R2_BUCKET_NAME,
                  Key: product.image_3,
                })
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
    relatedProducts = productsWithSignedUrls;
  }

  return NextResponse.json({
    brandInfo: rootBrand,
    productInfo: productInfoWithSignedUrls,
    relatedProducts,
  });
}
