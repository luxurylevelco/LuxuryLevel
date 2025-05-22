import { supabase } from "@/lib/supabase";
import { Brand } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

async function getAllCategoryIds(rootId: number): Promise<number[]> {
  const ids: number[] = [rootId];
  const stack: number[] = [rootId];

  while (stack.length > 0) {
    const currentId = stack.pop();
    if (!currentId) continue;

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
          ids.push(child.id);
          stack.push(child.id);
        }
      }
    }
  }

  console.log(`Found category IDs: ${ids}`);
  return ids;
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

  // Step 3: Fetch brand and its child brands if filterBrand is provided
  let brandIds: string[] = [];
  let subBrands: Brand[] = [];
  if (filterBrand) {
    const { data: brands, error: brandError } = await supabase
      .from("brand")
      .select("*")
      .or(`id.eq.${filterBrand},parent_id.eq.${filterBrand}`)
      .order("parent_id", { ascending: true });

    if (brandError) {
      return NextResponse.json({ error: brandError.message }, { status: 500 });
    }

    brandIds = brands.map((brand) => brand.id);
    subBrands = brands.slice(1);
  }

  // Step 4: Prepare base query for filters
  let baseQuery = supabase
    .from("product")
    .select("*", { count: "exact", head: true })
    .in("category_id", categoryIds);

  if (filterColor) {
    baseQuery = baseQuery.ilike("color", `%${filterColor}%`);
  }

  if (filterGender) {
    baseQuery = baseQuery.eq("gender", filterGender);
  }

  if (filterName) {
    baseQuery = baseQuery.ilike("name", `%${filterName}%`);
  }

  if (brandIds.length > 0) {
    baseQuery = baseQuery.in("brand_id", brandIds);
  }

  const { count, error: countError } = await baseQuery;

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  const totalPages = Math.ceil((count || 0) / noOfItems);

  // Step 5: Fetch paginated filtered products
  let productQuery = supabase
    .from("product")
    .select(
      `
      id,
      ref_no,
      name,
      description,
      color,
      gender,
      stock,
      price,
      image_1,
      image_2,
      image_3,
      created_at,
      updated_at
    `
    )
    .in("category_id", categoryIds)
    .range(from, to)
    .order("created_at", { ascending: false });

  if (filterColor) {
    productQuery = productQuery.ilike("color", `%${filterColor}%`);
  }

  if (filterGender) {
    productQuery = productQuery.eq("gender", filterGender);
  }

  if (filterName) {
    productQuery = productQuery.ilike("name", `%${filterName}%`);
  }

  if (brandIds.length > 0) {
    productQuery = productQuery.in("brand_id", brandIds);
  }

  const { data: products, error: productError } = await productQuery;

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  // Step 6: Fetch unique colors for filtered products
  let colorQuery = supabase
    .from("product")
    .select("color")
    .in("category_id", categoryIds)
    .not("color", "is", null);

  if (filterColor) {
    colorQuery = colorQuery.ilike("color", `%${filterColor}%`);
  }

  if (filterGender) {
    colorQuery = colorQuery.eq("gender", filterGender);
  }

  if (filterName) {
    colorQuery = colorQuery.ilike("name", `%${filterName}%`);
  }

  if (brandIds.length > 0) {
    colorQuery = colorQuery.in("brand_id", brandIds);
  }

  const { data: colorData, error: colorError } = await colorQuery;

  if (colorError) {
    return NextResponse.json({ error: colorError.message }, { status: 500 });
  }

  const uniqueColors = Array.from(
    new Set(
      colorData
        .map((p) => p.color?.trim())
        .filter((color): color is string => !!color)
    )
  );

  return NextResponse.json({
    subBrands: subBrands,
    colors: uniqueColors,
    products,
    page: {
      current: page,
      total: totalPages,
    },
  });
}
