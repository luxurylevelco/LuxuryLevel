import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// In-memory descendant category resolution
function getDescendantCategoryIds(
  allCategories: any[],
  parentId: string
): string[] {
  const result: string[] = [];
  const stack = [parentId];

  while (stack.length > 0) {
    const current = stack.pop()!;
    result.push(current);
    const children = allCategories.filter((c) => c.parent_id === current);
    stack.push(...children.map((c) => c.id));
  }

  return result;
}

// Common filter application function
function applyProductFilters(query: any, params: any, categoryIds?: string[]) {
  if (params.brandId) query = query.eq("brand_id", params.brandId);
  if (params.categoryId && categoryIds)
    query = query.in("category_id", categoryIds);
  if (params.color) query = query.eq("color", params.color);
  if (params.minPrice) query = query.gte("price", Number(params.minPrice));
  if (params.maxPrice) query = query.lte("price", Number(params.maxPrice));
  return query;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const params = {
    page: Number(searchParams.get("page") || 1),
    pageSize: Number(searchParams.get("pageSize") || 12),
    categoryId: searchParams.get("categoryId"),
    brandId: searchParams.get("brandId"),
    color: searchParams.get("color"),
    minPrice: searchParams.get("minPrice"),
    maxPrice: searchParams.get("maxPrice"),
  };

  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;

  // --- Category filtering setup
  let categoryIds: string[] | undefined;
  if (params.categoryId) {
    const { data: allCategories } = await supabase
      .from("category")
      .select("id, parent_id");
    if (!allCategories)
      return NextResponse.json(
        { error: "Failed to load categories" },
        { status: 500 }
      );
    categoryIds = getDescendantCategoryIds(allCategories, params.categoryId);
  }

  // --- Count query (minimal fields)
  let countQuery = supabase
    .from("product")
    .select("id", { count: "exact", head: false });
  countQuery = applyProductFilters(countQuery, params, categoryIds);
  const { count, error: countError } = await countQuery;
  if (countError)
    return NextResponse.json(
      { error: "Failed to fetch count" },
      { status: 500 }
    );

  // --- Product query
  let productQuery = supabase.from("product").select("*").range(from, to);
  productQuery = applyProductFilters(productQuery, params, categoryIds);
  const { data: products, error: productError } = await productQuery;
  if (productError)
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );

  // --- Unique colors from products
  const uniqueColors = Array.from(new Set(products.map((p) => p.color))).filter(
    Boolean
  );

  // --- Brand tree (single query)
  let brandData = null;
  if (params.brandId) {
    const { data: allBrands } = await supabase
      .from("brand")
      .select("id, parent_id, name");
    if (!allBrands)
      return NextResponse.json(
        { error: "Failed to load brands" },
        { status: 500 }
      );

    const mainBrand = allBrands.find((b) => b.id === params.brandId);
    const childBrands = allBrands.filter((b) => b.parent_id === params.brandId);
    const siblingBrands = mainBrand?.parent_id
      ? allBrands.filter(
          (b) => b.parent_id === mainBrand.parent_id && b.id !== mainBrand.id
        )
      : [];

    brandData = {
      mainBrand,
      childBrands,
      siblingBrands,
    };
  }

  return NextResponse.json({
    products,
    count,
    colors: uniqueColors,
    brand: brandData,
  });
}
