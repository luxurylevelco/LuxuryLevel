import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const page = parseInt(searchParams.get("page") || "1", 10);
  const noOfItems = parseInt(searchParams.get("noOfItems") || "10", 10);

  // filters
  const filterColor = searchParams.get("color");
  const filterGender = searchParams.get("gender");
  const filterName = searchParams.get("name");
  const filterBrand = searchParams.get("brand");

  // 1) Fetch subBrands + build brandIds[]
  let brandIds: number[] = [];
  let subBrands: { id: number; name: string }[] = [];

  if (filterBrand) {
    const bid = parseInt(filterBrand, 10);
    if (isNaN(bid)) {
      return NextResponse.json(
        { error: `Invalid brand ID: ${filterBrand}` },
        { status: 400 }
      );
    }

    // 1a) Fetch main+child brands
    const { data: brands, error: be } = await supabase
      .from("brand")
      .select("id, name, parent_id")
      .or(`id.eq.${bid},parent_id.eq.${bid}`);
    if (be) {
      return NextResponse.json({ error: be.message }, { status: 500 });
    }
    if (!brands?.length) {
      return NextResponse.json(
        { error: `Brand ${bid} not found` },
        { status: 404 }
      );
    }

    brandIds = brands.map((b) => b.id);

    // 1b) Pick sub‐brands
    const main = brands.find((b) => b.id === bid)!;
    if (main.parent_id) {
      const { data: sibs, error: se } = await supabase
        .from("brand")
        .select("id, name")
        .eq("parent_id", main.parent_id);
      if (se) return NextResponse.json({ error: se.message }, { status: 500 });
      subBrands = sibs!;
    } else {
      subBrands = brands.filter((b) => b.id !== main.id);
    }
  }

  // 2) Single RPC call
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "get_filtered_products_with_category",
    {
      p_root_category_id: null, // array of one
      p_filter_brand_ids: brandIds.length ? brandIds : null,
      p_filter_color: filterColor || null,
      p_filter_gender: filterGender || null,
      p_filter_name: filterName || null,
      p_page_number: page,
      p_items_per_page: noOfItems,
    }
  );

  if (rpcError) {
    return NextResponse.json({ error: rpcError.message }, { status: 500 });
  }

  // rpcData already has: { subBrands, colors, products, page: { current, total } }
  // but we want to override its subBrands with our computed one:
  rpcData.subBrands = subBrands;

  return NextResponse.json(rpcData);
}
