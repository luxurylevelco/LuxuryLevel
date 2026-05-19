// app/api/admin/products/[id]/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyAdminFromRequest } from "@/lib/admin-auth";
import { deleteObjectsFromR2 } from "@/lib/r2";

export async function DELETE(
  req: NextRequest,
  // 1. Wrap params in a Promise type
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin
    const admin = await verifyAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Await the params before reading the ID
    const resolvedParams = await params;
    const productId = parseInt(resolvedParams.id);

    const { data: product, error: fetchError } = await supabase
      .from("product")
      .select("image_1, image_2, image_3")
      .eq("id", productId)
      .single();

    if (fetchError || !product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    await deleteObjectsFromR2([product.image_1, product.image_2, product.image_3]);

    const { error } = await supabase
      .from("product")
      .delete()
      .eq("id", productId);

    if (error) {
      console.error("Delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete product" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Product deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}