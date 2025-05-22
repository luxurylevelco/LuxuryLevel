import { supabase } from "@/lib/supabase";
import { Brand } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const page = parseInt(searchParams.get("page") || "1");
  const noOfItems = parseInt(searchParams.get("noOfItems") || "10");

  const from = (page - 1) * noOfItems;
  const to = from + noOfItems - 1;

  const filterColor = searchParams.get("color");
  const filterGender = searchParams.get("gender");
  const filterName = searchParams.get("name");
  const filterBrand = searchParams.get("brand");

  let brandIds: string[] = [];
  let subBrands: Brand[] = [];

  if (filterBrand) {
    // Get the brand that matches the filterBrand
    const { data: mainBrand, error: mainBrandError } = await supabase
      .from("brand")
      .select("*")
      .eq("id", filterBrand)
      .single();

    if (mainBrandError || !mainBrand) {
      return NextResponse.json(
        { error: mainBrandError?.message || "Brand not found" },
        { status: 404 }
      );
    }

    // Get all brands that are children of this brand
    const { data: childBrands, error: childBrandError } = await supabase
      .from("brand")
      .select("*")
      .eq("parent_id", filterBrand);

    if (childBrandError) {
      return NextResponse.json(
        { error: childBrandError.message },
        { status: 500 }
      );
    }

    // Add brandIds (main brand + children)
    brandIds = [mainBrand.id, ...(childBrands?.map((b) => b.id) ?? [])];

    // If this brand has a parent, it's a child itself — fetch its siblings
    if (mainBrand.parent_id) {
      const { data: siblingBrands, error: siblingError } = await supabase
        .from("brand")
        .select("*")
        .eq("parent_id", mainBrand.parent_id);

      if (siblingError) {
        return NextResponse.json(
          { error: siblingError.message },
          { status: 500 }
        );
      }

      subBrands = siblingBrands;
    } else {
      console.log("Main brand has doesnt have parent id!");
      // If it's a parent, return its children as subBrands
      subBrands = childBrands ?? [];
    }
  }

  // Step 2: Prepare base query for filters
  let baseQuery = supabase
    .from("product")
    .select("*", { count: "exact", head: true });

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

  // Step 3: Fetch paginated filtered products
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

  // Step 4: Fetch unique colors for filtered products (not just paginated)
  let colorQuery = supabase
    .from("product")
    .select("color")
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
