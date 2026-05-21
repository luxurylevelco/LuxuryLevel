/**
 * Product Sync Scheduler
 * Runs weekly on Sunday at 8 AM Kuwait time (UTC+3)
 * Can also be triggered manually
 */

import { createClient } from '@supabase/supabase-js';
import { CronJob } from 'cron';
import { scraper } from './scraper';
import { compareProducts } from './compare-products';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

let syncJob: CronJob | null = null;

/**
 * Execute the sync process
 */
export async function executeSyncProcess(triggeredByAdminId?: string): Promise<string> {
  console.log('[Scheduler] Starting sync process...');

  let syncRunId = '';

  try {
    // Create sync run record
    const { data: runRecord, error: createError } = await supabase
      .from('sync_runs')
      .insert({
        run_type: triggeredByAdminId ? 'manual' : 'scheduled',
        status: 'running',
        triggered_by: triggeredByAdminId || null,
      })
      .select('id')
      .single();

    if (createError) {
      console.error('[Scheduler] Error creating sync run:', createError);
      throw createError;
    }

    syncRunId = runRecord.id;
    console.log(`[Scheduler] Sync run created: ${syncRunId}`);

    // Initialize scraper
    await scraper.initialize();

    // Scrape all categories
    const referenceProducts = await scraper.scrapeAll();

    // Close scraper
    await scraper.close();

    console.log('[Scheduler] Scraping complete, starting comparison...');

    // Compare products
    const stats = await compareProducts(referenceProducts);

    // Update sync run with results
    const { error: updateError } = await supabase
      .from('sync_runs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        ...stats,
      })
      .eq('id', syncRunId);

    if (updateError) {
      console.error('[Scheduler] Error updating sync run:', updateError);
    }

    console.log('[Scheduler] Sync process completed successfully:', stats);
    return syncRunId;
  } catch (error) {
    console.error('[Scheduler] Sync process failed:', error);

    if (syncRunId) {
      await supabase
        .from('sync_runs')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncRunId);
    }

    throw error;
  }
}

/**
 * Initialize the scheduler
 * Runs every Sunday at 8 AM Kuwait time (UTC+3)
 * Using cron expression: 0 8 * * 0
 * But accounting for server timezone, we need to adjust based on process.env.TZ
 */
export function initializeScheduler() {
  if (syncJob) {
    console.log('[Scheduler] Scheduler already initialized');
    return;
  }

  try {
    // Kuwait timezone is UTC+3, but cron runs in server timezone
    // We use TZ environment variable to handle this
    // Format: second minute hour day_of_month month day_of_week
    // Sunday 8 AM: 0 8 * * 0
    
    syncJob = new CronJob(
      '0 8 * * 0', // Every Sunday at 8 AM
      async () => {
        console.log('[Scheduler] Scheduled sync triggered');
        try {
          await executeSyncProcess();
        } catch (error) {
          console.error('[Scheduler] Scheduled sync failed:', error);
        }
      },
      null, // onComplete callback
      true, // start immediately
      'Asia/Kuwait' // Timezone
    );

    console.log('[Scheduler] Scheduler initialized - runs every Sunday at 8 AM Kuwait time');
  } catch (error) {
    console.error('[Scheduler] Failed to initialize scheduler:', error);
  }
}

/**
 * Stop the scheduler
 */
export function stopScheduler() {
  if (syncJob) {
    syncJob.stop();
    syncJob = null;
    console.log('[Scheduler] Scheduler stopped');
  }
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus() {
  return {
    initialized: syncJob !== null,
    running: syncJob ? syncJob.running : false,
    nextDate: syncJob ? syncJob.nextDate() : null,
  };
}
