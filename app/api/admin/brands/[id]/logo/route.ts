import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/admin-auth';
import { uploadFileToR2 } from '@/lib/r2';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/types';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await the params object to satisfy Next.js 15 constraints
    const resolvedParams = await params;
    const brandId = resolvedParams.id;

    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminId = await verifyAdminToken(token);
    if (!adminId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get FormData from request
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = await file.arrayBuffer();

    // Upload to R2
    const timestamp = Date.now();
    const fileName = `brands/${timestamp}-${file.name}`;

    const logoUrl = await uploadFileToR2(buffer, fileName, file.type);

    // Update brand with logo URL using the resolved brandId
    const { data: brand, error: updateError } = await supabase
      .from('brand')
      .update({ logo_url: logoUrl })
      .eq('id', brandId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log(`[API] Brand logo uploaded: ${brandId}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Logo uploaded successfully',
        logo_url: logoUrl,
        brand,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] Error uploading brand logo:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to upload logo' },
      { status: 500 }
    );
  }
}