// app/api/brands/featured.ts
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  const { data: featuredBrands, error } = await supabase
    .from("brand")
    .select("id, name, logo_url, description")
    .eq("featured", "TRUE");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(featuredBrands);
}
