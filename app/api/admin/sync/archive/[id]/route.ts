import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { deleteObjectsFromR2 } from '@/lib/r2';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const stagingId = resolvedParams.id;

    console.log(`[API] Deleting missing item from both staging and live: ${stagingId}`);

    // 1. Kunin ang ref_no mula sa staging table
    const { data: stagingData, error: fetchError } = await supabaseAdmin
      .from('staging_products')
      .select('scraped_ref_no')
      .eq('id', stagingId)
      .single();

    if (fetchError || !stagingData) throw new Error('Staging item not found');

    // 2. 🚨 HARD DELETE sa Live Product table!
    if (stagingData.scraped_ref_no) {
      const { data: productData, error: productFetchError } = await supabaseAdmin
        .from('product')
        .select('image_1, image_2, image_3')
        .eq('ref_no', stagingData.scraped_ref_no)
        .maybeSingle();

      if (productFetchError) throw new Error(`Failed to fetch live product: ${productFetchError.message}`);

      if (productData) {
        await deleteObjectsFromR2([
          productData.image_1,
          productData.image_2,
          productData.image_3
        ]);
      }

      const { error: deleteLiveError } = await supabaseAdmin
        .from('product')
        .delete()
        .eq('ref_no', stagingData.scraped_ref_no);

      if (deleteLiveError) throw new Error(`Failed to delete live product: ${deleteLiveError.message}`);
    }

    // 3. Burahin ang row sa staging table para malinis ang Inbox
    const { error: deleteStagingError } = await supabaseAdmin
      .from('staging_products')
      .delete()
      .eq('id', stagingId);
      
    if (deleteStagingError) throw new Error(`Failed to clear staging item: ${deleteStagingError.message}`);

    return NextResponse.json({ success: true, message: 'Product permanently deleted from live store and staging' }, { status: 200 });

  } catch (error: any) {
    console.error('[API] Error deleting item:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}