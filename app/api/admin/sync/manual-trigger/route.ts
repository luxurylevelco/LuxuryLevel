/**
 * API: Manual Product Sync Trigger
 * POST /api/admin/sync/manual-trigger
 * 
 * Triggers the product synchronization process manually
 * Requires admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/admin-auth';
import { executeSyncProcess } from '@/lib/scraping/scheduler';

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminId = await verifyAdminToken(token);
    if (!adminId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log(`[API] Manual sync triggered by admin: ${adminId}`);

    // Execute sync process
    // Bagong code:
const syncRunId = await executeSyncProcess((adminId as any).id || (adminId as unknown as string));

    return NextResponse.json(
      {
        success: true,
        message: 'Sync process started',
        syncRunId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] Error triggering manual sync:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to trigger sync',
      },
      { status: 500 }
    );
  }
}
