import { supabase } from "@/lib/supabase";
import { ProductResponse } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

async function getAllCategoryIds(rootId: number): Promise<number[]> {
  const ids = new Set<number>([rootId]);
  const stack = [rootId];

  while (stack.length > 0) {
    const currentId = stack.pop()!;
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

    for (const child of children || []) {
      if (!ids.has(child.id)) {
        ids.add(child.id);
        stack.push(child.id);
      }
    }
  }

  console.log(`Found category IDs: ${[...ids]}`);
  return [...ids];
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug: categoryName } = await params;
  const { searchParams } = new URL(req.url);

  const page = parseInt(searchParams.get("page") || "1");
  const noOfItems = parseInt(searchParams.get("noOfItems") || "10");
  const from = (page - 1) * noOfItems;
  const to = from + noOfItems - 1;

  const filterColor = searchParams.get("color");
  const filterGender = searchParams.get("gender");
  const filterName = searchParams.get("name");
  const filterBrand = searchParams.get("brand");

  // Step 1: Find the category ID for category name
  const { data: category, error: categoryError } = await supabase
    .from("category")
    .select("id")
    .ilike("name", `%${categoryName}%`)
    .single();

  if (categoryError || !category) {
    return NextResponse.json(
      { error: `${categoryName} category not found.` },
      { status: 404 }
    );
  }

  // Step 2: Get all category IDs (including children, grandchildren, etc.)
  const categoryIds = await getAllCategoryIds(category.id);

  // Step 3: Fetch brand data if filterBrand is provided
  let brandIds: number[] = [];
  let subBrands: ProductResponse["subBrands"] = [];

  if (filterBrand) {
    const brandId = parseInt(filterBrand); // Convert filterBrand to int4
    if (isNaN(brandId)) {
      console.warn(`Invalid brand ID: ${filterBrand}`);
      return NextResponse.json(
        { error: `Invalid brand ID: ${filterBrand}` },
        { status: 400 }
      );
    }

    // Fetch main brand and its children in one query
    const { data: brands, error: brandError } = await supabase
      .from("brand")
      .select("id, name, parent_id")
      .or(`id.eq.${brandId},parent_id.eq.${brandId}`);

    if (brandError) {
      console.error(
        `Error fetching brands for brandId ${brandId}:`,
        brandError
      );
      return NextResponse.json(
        { error: brandError.message || "Error fetching brands" },
        { status: 500 }
      );
    }

    if (!brands || brands.length === 0) {
      console.warn(`No brands found for brandId ${brandId}`);
      return NextResponse.json(
        { error: `Brand ${brandId} not found` },
        { status: 404 }
      );
    }

    const mainBrand = brands.find((b) => b.id === brandId);
    if (!mainBrand) {
      console.warn(`Main brand ${brandId} not found in results`);
      return NextResponse.json(
        { error: `Brand ${brandId} not found` },
        { status: 404 }
      );
    }

    brandIds = brands.map((b) => b.id); // Keep as numbers
    console.log(`Brand IDs for filter: ${brandIds}`);

    // Fetch siblings if mainBrand has a parent
    if (mainBrand.parent_id) {
      const { data: siblingBrands, error: siblingError } = await supabase
        .from("brand")
        .select("id, name")
        .eq("parent_id", mainBrand.parent_id);

      if (siblingError) {
        console.error(
          `Error fetching sibling brands for parent_id ${mainBrand.parent_id}:`,
          siblingError
        );
        return NextResponse.json(
          { error: siblingError.message },
          { status: 500 }
        );
      }
      subBrands = siblingBrands || [];
      console.log(`Sibling brands:`, subBrands);
    } else {
      subBrands = brands.filter((b) => b.id !== mainBrand.id);
      console.log(`Child brands (no parent):`, subBrands);
    }
  }

  // Step 4: Build base query for products and colors
  const buildQuery = (selectFields: string, withCount: boolean = false) => {
    let query = supabase
      .from("product")
      .select(selectFields, withCount ? { count: "exact", head: true } : {})
      .in("category_id", categoryIds);

    if (filterColor) {
      query = query.ilike("color", `%${filterColor}%`);
    }
    if (filterGender) {
      query = query.eq("gender", filterGender);
    }
    if (filterName) {
      query = query.ilike("name", `%${filterName}%`);
    }
    if (brandIds.length > 0) {
      query = query.in("brand_id", brandIds);
    }

    return query;
  };

  // Step 5: Fetch count, products, and colors in parallel
  const [countResponse, productResponse, colorResponse] = await Promise.all([
    buildQuery("*", true),
    buildQuery("id, name,  price, image_1, image_2, image_3")
      .range(from, to)
      .order("created_at", { ascending: false }),
    buildQuery("color").not("color", "is", null),
  ]);

  // Handle count response
  const { count, error: countError } = countResponse;
  if (countError) {
    console.error("Error fetching product count:", countError);
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }
  console.log(`Total product count: ${count}`);

  // Handle product response
  const { data: products, error: productError } = productResponse;
  if (productError) {
    console.error("Error fetching products:", productError);
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }
  console.log(`Fetched ${products.length} products for page ${page}`);

  // Handle color response
  const { data: colorData, error: colorError } = await colorResponse;
  if (colorError) {
    console.error("Error fetching colors:", colorError);
    return NextResponse.json({ error: colorError.message }, { status: 500 });
  }

  // Suppress TypeScript error for color property access

  const uniqueColors = Array.from(
    new Set(
      // eslint-disable-next-line
      colorData?.map((p: any) => p.color?.trim()).filter((color) => !!color) ??
        []
    )
  );
  console.log(`Unique colors: ${uniqueColors}`);

  const totalPages = Math.ceil((count || 0) / noOfItems);

  return NextResponse.json({
    subBrands,
    colors: uniqueColors,
    products,
    page: {
      current: page,
      total: totalPages,
    },
  });
}
