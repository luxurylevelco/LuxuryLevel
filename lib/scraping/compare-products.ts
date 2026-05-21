/**
 * Product Comparison Engine
 * Compares reference website products with local database products
 */

import { createClient } from '@supabase/supabase-js';
import { ReferenceProductData, ProductCategory, SyncRunStats } from './types';


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface LocalProduct {
  id: string;
  name: string;
  ref_no: string;
  price: number;
  brand: { name: string } | null;
  category: { name: string } | null;
  description: string | null;
  color: string | null;
  gender: string | null;
}

/**
 * Normalize product name for comparison
 */
function normalizeProductName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Compare two prices - return true if difference is significant
 */
function hasPriceDifference(price1: number, price2: number, threshold: number = 0): boolean {
  return Math.abs(price1 - price2) > threshold;
}

/**
 * Main comparison engine
 */
export async function compareProducts(
  referenceProducts: Map<ProductCategory, ReferenceProductData[]>
): Promise<SyncRunStats> {
  console.log('[Compare] Starting product comparison...');

  const stats: SyncRunStats = {
    products_scanned: 0,
    products_found_missing: 0,
    products_with_price_diff: 0,
    products_marked_extra: 0,
    started_at: new Date().toISOString(),
  };

  try {
    // Fetch all local products
    const { data: localProducts, error: fetchError } = await supabase
      .from('product')
      .select(
        `
        id,
        name,
        ref_no,
        price,
        brand:brand_id(name),
        category:category_id(name),
        description,
        color,
        gender
      `
      )
      .eq('is_active', true);

    if (fetchError) {
      console.error('[Compare] Error fetching local products:', fetchError);
      throw fetchError;
    }

    stats.products_scanned = localProducts?.length || 0;
    console.log(`[Compare] Found ${stats.products_scanned} local products`);

    const localProductsMap = new Map<string, LocalProduct>();
    const localProductsByBrand = new Map<string, LocalProduct[]>();

    // Index local products by normalized name
    localProducts?.forEach((product: any) => {
      const normalizedName = normalizeProductName(product.name);
      localProductsMap.set(normalizedName, product);

      const brandName = (product.brand?.name || 'Unknown').toLowerCase();
      if (!localProductsByBrand.has(brandName)) {
        localProductsByBrand.set(brandName, []);
      }
      localProductsByBrand.get(brandName)!.push(product);
    });

    // Track which local products were matched
    const matchedLocalProductIds = new Set<string>();

    // Compare reference products with local products
    for (const [category, refProducts] of referenceProducts.entries()) {
      console.log(`[Compare] Processing ${refProducts.length} reference products from ${category}`);

      for (const refProduct of refProducts) {
        const normalizedRefName = normalizeProductName(refProduct.name);
        const localProduct = localProductsMap.get(normalizedRefName);

        if (!localProduct) {
          // Product missing from our database
          console.log(`[Compare] Missing product: ${refProduct.name}`);

          // Create sync pending record
          const { error: insertError } = await supabase.from('product_sync_pending').insert({
            sync_type: 'missing',
            product_category: category,
            reference_data: refProduct,
            status: 'pending',
          });

          if (insertError) {
            console.error('[Compare] Error creating missing product sync record:', insertError);
          } else {
            stats.products_found_missing++;
          }
        } else {
          // Product exists - check for price difference
          matchedLocalProductIds.add(localProduct.id);

          if (hasPriceDifference(refProduct.price, localProduct.price, 0)) {
            // Price difference detected (ANY difference)
            console.log(
              `[Compare] Price difference for ${refProduct.name}: Ref=${refProduct.price}, Local=${localProduct.price}`
            );

            const { error: insertError } = await supabase.from('product_sync_pending').insert({
              sync_type: 'price_diff',
              product_category: category,
              reference_data: {
                ...refProduct,
                local_price: localProduct.price,
              },
              local_product_id: localProduct.id,
              status: 'pending',
              admin_notes: `Reference price: AED ${refProduct.price}, Current price: AED ${localProduct.price}`,
            });

            if (insertError) {
              console.error('[Compare] Error creating price difference sync record:', insertError);
            } else {
              stats.products_with_price_diff++;
            }
          }
        }
      }
    }

    // Find products we have that reference doesn't
    for (const [normalizedName, localProduct] of localProductsMap.entries()) {
      if (!matchedLocalProductIds.has(localProduct.id)) {
        console.log(`[Compare] Extra product not in reference: ${localProduct.name}`);

        const { error: insertError } = await supabase.from('product_sync_pending').insert({
          sync_type: 'extra',
          product_category: 'bags', // Default category for extra products
          reference_data: {
            name: localProduct.name,
            brand: localProduct.brand?.name || 'Unknown',
            price: localProduct.price,
            description: localProduct.description || '',
            color: localProduct.color || '',
            gender: localProduct.gender || '',
            sku: localProduct.ref_no,
            reference_source: 'local',
            local_product_id: localProduct.id,
          },
          local_product_id: localProduct.id,
          status: 'pending',
          admin_notes: 'This product exists in our database but not in the reference website. Consider if it should be archived or deleted.',
        });

        if (insertError) {
          console.error('[Compare] Error creating extra product sync record:', insertError);
        } else {
          stats.products_marked_extra++;
        }
      }
    }

    console.log('[Compare] Comparison complete:', stats);
    return stats;
  } catch (error) {
    console.error('[Compare] Comparison failed:', error);
    throw error;
  }
}

/**
 * Get pending sync items for admin review
 */
export async function getPendingSyncItems(syncType?: string, limit: number = 50, offset: number = 0) {
  let query = supabase.from('product_sync_pending').select('*', { count: 'exact' }).eq('status', 'pending');

  if (syncType) {
    query = query.eq('sync_type', syncType);
  }

  const { data, count, error } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  if (error) {
    console.error('[Compare] Error fetching pending sync items:', error);
    throw error;
  }

  return { items: data, total: count };
}

/**
 * Approve and import/update a product
 */
export async function approveSyncItem(syncId: string, adminId: string, actionNotes?: string) {
  try {
    // Get the sync record
    const { data: syncRecord, error: fetchError } = await supabase
      .from('product_sync_pending')
      .select('*')
      .eq('id', syncId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Determine action based on sync_type
    let actionType = 'import';
    if (syncRecord.sync_type === 'price_diff') {
      actionType = 'update_price';
    } else if (syncRecord.sync_type === 'extra') {
      actionType = 'archive';
    }

    // Update sync record as approved
    const { error: updateError } = await supabase
      .from('product_sync_pending')
      .update({
        status: 'approved',
        action_type: actionType,
        admin_notes: actionNotes || syncRecord.admin_notes,
        approved_at: new Date().toISOString(),
        approved_by: adminId,
      })
      .eq('id', syncId);

    if (updateError) {
      throw updateError;
    }

    // Log to history
    await supabase.from('product_sync_history').insert({
      sync_pending_id: syncId,
      action: `${actionType}_approved`,
      new_data: syncRecord,
      admin_id: adminId,
      notes: actionNotes,
    });

    console.log(`[Compare] Sync item ${syncId} approved for ${actionType}`);
    return syncRecord;
  } catch (error) {
    console.error('[Compare] Error approving sync item:', error);
    throw error;
  }
}

/**
 * Reject a sync item
 */
export async function rejectSyncItem(syncId: string, adminId: string, reason?: string) {
  try {
    const { error: updateError } = await supabase
      .from('product_sync_pending')
      .update({
        status: 'rejected',
        admin_notes: reason || 'Rejected by admin',
        approved_at: new Date().toISOString(),
        approved_by: adminId,
      })
      .eq('id', syncId);

    if (updateError) {
      throw updateError;
    }

    // Log to history
    await supabase.from('product_sync_history').insert({
      sync_pending_id: syncId,
      action: 'rejected',
      admin_id: adminId,
      notes: reason,
    });

    console.log(`[Compare] Sync item ${syncId} rejected`);
  } catch (error) {
    console.error('[Compare] Error rejecting sync item:', error);
    throw error;
  }
}
