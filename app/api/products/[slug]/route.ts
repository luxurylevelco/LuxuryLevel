import { supabase } from "@/lib/supabase";
import { ProductResponse } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

// Efficient recursive category ID traversal using a pre-fetched tree
async function getAllCategoryIds(rootId: number): Promise<number[]> {
  const { data: allCategories, error } = await supabase
    .from("category")
    .select("id, parent_id");

  if (error || !allCategories) {
    console.error("Error fetching category tree:", error);
    return [rootId];
  }

  const idSet = new Set<number>();
  const queue = [rootId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    idSet.add(currentId);

    const children = allCategories.filter((c) => c.parent_id === currentId);
    for (const child of children) {
      if (!idSet.has(child.id)) {
        queue.push(child.id);
      }
    }
  }

  return Array.from(idSet);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug: categoryName } = await params;
  const { searchParams } = new URL(req.url);

  const page = parseInt(searchParams.get("page") || "1", 10);
  const noOfItems = parseInt(searchParams.get("noOfItems") || "10", 10);
  const from = (page - 1) * noOfItems;
  const to = from + noOfItems - 1;

  const filterColor = searchParams.get("color");
  const filterGender = searchParams.get("gender");
  const filterName = searchParams.get("name");
  const filterBrand = searchParams.get("brand");

  // Step 1: Find the root category
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

  // Step 2: Get all related category IDs
  const categoryIds = await getAllCategoryIds(category.id);

  // Step 3: Handle brand filtering
  let brandIds: number[] = [];
  let subBrands: ProductResponse["subBrands"] = [];

  if (filterBrand) {
    const brandId = parseInt(filterBrand);
    if (isNaN(brandId)) {
      return NextResponse.json(
        { error: `Invalid brand ID: ${filterBrand}` },
        { status: 400 }
      );
    }

    const { data: brands, error: brandError } = await supabase
      .from("brand")
      .select("id, name, parent_id")
      .or(`id.eq.${brandId},parent_id.eq.${brandId}`);

    if (brandError || !brands?.length) {
      return NextResponse.json(
        { error: `Brand ${brandId} not found` },
        { status: 404 }
      );
    }

    const mainBrand = brands.find((b) => b.id === brandId);
    brandIds = brands.map((b) => b.id);

    if (mainBrand?.parent_id) {
      const { data: siblingBrands } = await supabase
        .from("brand")
        .select("id, name")
        .eq("parent_id", mainBrand.parent_id);
      subBrands = siblingBrands || [];
    } else {
      subBrands = brands.filter((b) => b.id !== mainBrand?.id);
    }
  }

  // Step 4: Build reusable query
  const buildQuery = (fields: string, count = false) => {
    let query = supabase
      .from("product")
      .select(fields, count ? { count: "exact", head: true } : {})
      .in("category_id", categoryIds);

    if (filterColor) query = query.ilike("color", `%${filterColor}%`);
    if (filterGender) query = query.eq("gender", filterGender);
    if (filterName) query = query.ilike("name", `%${filterName}%`);
    if (brandIds.length) query = query.in("brand_id", brandIds);

    return query;
  };

  // Step 5: Fetch in parallel
  const [countResponse, productResponse, colorResponse] = await Promise.all([
    buildQuery("*", true),
    buildQuery("id, name, price, image_1, image_2, image_3")
      .range(from, to)
      .order("created_at", { ascending: false }),
    buildQuery("color").not("color", "is", null),
  ]);

  const { count, error: countError } = countResponse;
  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  const { data: products, error: productError } = productResponse;
  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  const { data: colorData, error: colorError } = await colorResponse;
  if (colorError) {
    return NextResponse.json({ error: colorError.message }, { status: 500 });
  }

  const uniqueColors = Array.from(
    //eslint-disable-next-line
    new Set(colorData?.map((p: any) => p.color?.trim()).filter(Boolean) ?? [])
  );

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
