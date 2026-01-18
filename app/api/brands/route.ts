import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  // 1. Fixed table name to plural "brands"
  const { data: brands, error } = await supabase
    .from("brands")
    .select("*")
    .is("parent_id", null)
    .order("id", { ascending: true });

  if (error) {
    // Log the error to your Vercel console for debugging
    console.error("Supabase Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 2. Removed the curly braces to return a raw Array
  return NextResponse.json(brands);
}