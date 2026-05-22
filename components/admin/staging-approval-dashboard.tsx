'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { buildBrandIndex, matchBrandFromCandidates } from '@/lib/brand-matcher';
import {
  Check,
  X,
  Loader2,
  RefreshCw,
  Trash2,
  TrendingUp,
  TrendingDown,
  PackagePlus,
  Tag,
  ArchiveX,
  Layers,
  Filter,
  ChevronDown,
  ListChecks,
  Search,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

interface StagingProduct {
  id: number;
  scraped_ref_no: string;
  scraped_name: string;
  scraped_price: number | null;
  raw_brand_name: string;
  raw_category_name: string;
  sync_status: string;
  created_at: string;
  error_message?: string;
  local_product?: { id: number; price: number } | null;
  is_price_change?: boolean;
  is_archive?: boolean;
}

interface LocalProductRef {
  id: number;
  ref_no: string;
  price: number;
}

let supabaseClient: ReturnType<typeof createClient> | null = null;
const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return supabaseClient;
};

export default function StagingApprovalDashboard() {
  const [stagingProducts, setStagingProducts] = useState<StagingProduct[]>([]);
  const [allStagingProducts, setAllStagingProducts] = useState<StagingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<number | null>(null);
  const [rejecting, setRejecting] = useState<number | null>(null);
  const [batchApproving, setBatchApproving] = useState(false);
  const [batchRejecting, setBatchRejecting] = useState(false);
  
  // 🚀 SCRAPER STATES
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeCategory, setScrapeCategory] = useState('watches');
  
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
  // 🔥 MULTI-SELECT BRAND FILTER STATES 🔥
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [isBrandFilterOpen, setIsBrandFilterOpen] = useState(false);
  const brandFilterRef = useRef<HTMLDivElement>(null);

  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>(''); 
  
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  
  const [filter, setFilter] = useState<'new' | 'updates' | 'archive' | 'all'>('new');
  const [stats, setStats] = useState({ total: 0, newProducts: 0, priceUpdates: 0, toArchive: 0 });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 🚀 BRAND VALIDATION STATES
  const [dbBrands, setDbBrands] = useState<{id: number, name: string}[]>([]);
  const [brandValidationModal, setBrandValidationModal] = useState<{
    isOpen: boolean;
    stagingIds: number[];
    rawBrands: string[];
    isBulk: boolean;
  }>({ isOpen: false, stagingIds: [], rawBrands: [], isBulk: false });
  
  const [selectedMappedBrand, setSelectedMappedBrand] = useState<string>('');
  
  // 🚀 CUSTOM SEARCHABLE DROPDOWN STATES
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const [brandSearchQuery, setBrandSearchQuery] = useState('');

  const brandIndex = useMemo(() => {
    return buildBrandIndex(dbBrands.map((brand) => brand.name));
  }, [dbBrands]);

  const resolveBrandMatch = (product: StagingProduct | undefined | null) => {
    if (!product) return null;
    return matchBrandFromCandidates(brandIndex, [
      product.raw_brand_name,
      product.scraped_name,
    ]);
  };

  const getDisplayBrand = (product: StagingProduct | undefined | null) => {
    return resolveBrandMatch(product) || product?.raw_brand_name || 'Unknown';
  };

  const normalizeBrandKey = (value: string | null | undefined) => {
    if (!value) return '';
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/["'.]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const matchesBrandFilter = (product: StagingProduct, selectedBrandsArr: string[]) => {
    if (!selectedBrandsArr || selectedBrandsArr.length === 0) return true;
    
    const resolved = normalizeBrandKey(getDisplayBrand(product));
    const raw = normalizeBrandKey(product.raw_brand_name);
    const name = normalizeBrandKey(product.scraped_name);

    return selectedBrandsArr.some(filterValue => {
      const target = normalizeBrandKey(filterValue);
      if (!target) return true;
      return resolved === target || raw === target || name.includes(target);
    });
  };

  // Close brand filter when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (brandFilterRef.current && !brandFilterRef.current.contains(event.target as Node)) {
        setIsBrandFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

const fetchStagingProducts = async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      
      const { data: realBrands } = await supabase.from('brand').select('id, name').order('name', { ascending: true });
      setDbBrands(realBrands || []);

      // 🔥 FIX 1: ADDED .limit(10000) PARA MAKUHA LAHAT NG STAGING ITEMS 🔥
      const { data: stagingData, error: stagingError } = await supabase
        .from('staging_products')
        .select('*')
        .in('sync_status', ['pending', 'missing'])
        .order('created_at', { ascending: false })
        .limit(10000); 

      if (stagingError) throw new Error(stagingError.message);
      if (!stagingData || stagingData.length === 0) {
        setAllStagingProducts([]);
        setStagingProducts([]);
        setBrandOptions([]);
        setCategoryOptions([]);
        setStats({ total: 0, newProducts: 0, priceUpdates: 0, toArchive: 0 });
        setLoading(false);
        return;
      }

      const stagingRows = (stagingData || []) as StagingProduct[];
      const refNos = stagingRows.map(p => p.scraped_ref_no).filter(Boolean);

      // 🔥 FIX 2: KUNIN NA LAHAT NG LIVE PRODUCTS (LIMIT 10000) PARA IWAS "URI TOO LONG" CRASH 🔥
      // Tinanggal natin yung .in('ref_no', refNos) dahil sasabog 'yun kapag 3,000+ ang laman.
      const { data: localProducts } = await supabase
        .from('product')
        .select('id, ref_no, price')
        .limit(10000); 

      const localProductRows = (localProducts || []) as LocalProductRef[];

      let newCount = 0;
      let updateCount = 0;
      let archiveCount = 0;

      const enrichedData: StagingProduct[] = stagingRows.map(staging => {
        const local = localProductRows.find(p => p.ref_no === staging.scraped_ref_no);
        
        const isArchive = staging.sync_status === 'missing';
        const isNew = !local && !isArchive;
        const isPriceChange = local && !isArchive && staging.scraped_price !== null && Number(local.price) !== Number(staging.scraped_price);

        if (isNew) newCount++;
        else if (isArchive) archiveCount++;
        else if (isPriceChange) updateCount++;

        return { ...staging, local_product: local || null, is_price_change: isPriceChange, is_archive: isArchive };
      });

      // 🔥 ALPHABETICAL BRAND OPTIONS 🔥
      const brands = Array.from(
        new Set(
          enrichedData
            .map((item) => getDisplayBrand(item))
            .filter((brand) => {
              if (!brand) return false;
              return normalizeBrandKey(brand) !== 'unknown';
            })
        )
      ).sort((a, b) => a.localeCompare(b)); 

      const cats = Array.from(new Set(stagingData.map((s: any) => s.raw_category_name).filter(Boolean)));

      setBrandOptions(brands);
      setCategoryOptions(cats);
      setAllStagingProducts(enrichedData);

      let filteredData = enrichedData;
      if (selectedBrands.length > 0) filteredData = filteredData.filter(p => matchesBrandFilter(p, selectedBrands));
      if (categoryFilter) filteredData = filteredData.filter(p => p.raw_category_name === categoryFilter);
      if (filter === 'new') filteredData = enrichedData.filter(p => !p.local_product && !p.is_archive);
      else if (filter === 'updates') filteredData = enrichedData.filter(p => p.is_price_change);
      else if (filter === 'archive') filteredData = enrichedData.filter(p => p.is_archive);

      if (searchTerm) {
        const lowerQuery = searchTerm.toLowerCase();
        filteredData = filteredData.filter(p => 
          (p.scraped_name && p.scraped_name.toLowerCase().includes(lowerQuery)) ||
          (p.scraped_ref_no && p.scraped_ref_no.toLowerCase().includes(lowerQuery))
        );
      }

      setStagingProducts(filteredData);
      setStats({ total: stagingRows.length, newProducts: newCount, priceUpdates: updateCount, toArchive: archiveCount });
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Failed to load data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStagingProducts(); }, [filter]);

  // 🚀 DYNAMIC STATS & FILTERING EFFECT
  useEffect(() => {
    if (!allStagingProducts.length) {
      setStats({ total: 0, newProducts: 0, priceUpdates: 0, toArchive: 0 });
      setStagingProducts([]);
      return;
    }

    let baseFiltered = allStagingProducts;

    if (selectedBrands.length > 0) baseFiltered = baseFiltered.filter(p => matchesBrandFilter(p, selectedBrands));
    if (categoryFilter) baseFiltered = baseFiltered.filter(p => p.raw_category_name === categoryFilter);
    
    if (searchTerm) {
      const lowerQuery = searchTerm.toLowerCase();
      baseFiltered = baseFiltered.filter(p => 
        (p.scraped_name && p.scraped_name.toLowerCase().includes(lowerQuery)) ||
        (p.scraped_ref_no && p.scraped_ref_no.toLowerCase().includes(lowerQuery))
      );
    }

    let newCount = 0;
    let updateCount = 0;
    let archiveCount = 0;

    baseFiltered.forEach(p => {
      if (p.is_archive) archiveCount++;
      else if (p.is_price_change) updateCount++;
      else if (!p.local_product) newCount++;
    });

    setStats({ 
      total: baseFiltered.length, 
      newProducts: newCount, 
      priceUpdates: updateCount, 
      toArchive: archiveCount 
    });

    let finalFiltered = baseFiltered;
    if (filter === 'new') finalFiltered = baseFiltered.filter(p => !p.local_product && !p.is_archive);
    else if (filter === 'updates') finalFiltered = baseFiltered.filter(p => p.is_price_change);
    else if (filter === 'archive') finalFiltered = baseFiltered.filter(p => p.is_archive);

    setStagingProducts(finalFiltered);
  }, [selectedBrands, categoryFilter, filter, allStagingProducts, searchTerm]);

  const handleRunScraper = async () => {
    if (!confirm(`Are you sure you want to scrape ${scrapeCategory.toUpperCase()} from LuxurySouq?`)) return;
    
    setIsScraping(true);
    setMessage(null);
    
    try {
      const res = await fetch('/api/admin/scraper/run', { 
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ category: scrapeCategory })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: data.message });
        await fetchStagingProducts();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to run scraper.' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'A network error occurred while scraping.' });
    } finally {
      setIsScraping(false);
    }
  };

  const validateAndApprove = (ids: number[]) => {
    const missingBrands = new Set<string>();

    ids.forEach(id => {
      const product = allStagingProducts.find(p => p.id === id) || stagingProducts.find(p => p.id === id);
      if (product) {
        const bName = (product.raw_brand_name || '').trim();
        const matchedBrand = resolveBrandMatch(product);
        const brandExists = Boolean(matchedBrand) || dbBrands.some(b => b.name.toLowerCase() === bName.toLowerCase());
        const isUnbranded = bName.toLowerCase() === 'unbranded' || bName === '';
        
        if (!brandExists && !isUnbranded) {
          missingBrands.add(bName);
        }
      }
    });

    if (missingBrands.size > 0) {
      setBrandValidationModal({
        isOpen: true,
        stagingIds: ids,
        rawBrands: Array.from(missingBrands),
        isBulk: ids.length > 1
      });
      return;
    }

    proceedWithApproval(ids);
  };

  const proceedWithApproval = async (ids: number[], mappedBrandName?: string) => {
    setBrandValidationModal({ isOpen: false, stagingIds: [], rawBrands: [], isBulk: false }); 
    setSelectedMappedBrand('');
    setIsBrandDropdownOpen(false);
    setBrandSearchQuery('');
    
    if (!ids.length) {
      setMessage({ type: 'error', text: `No valid products selected.` });
      return;
    }

    setBatchApproving(true);
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || '';
    let success = 0; let failed = 0;
    
    for (const id of ids) {
      const product = allStagingProducts.find(p => p.id === id) || stagingProducts.find(p => p.id === id);
      const matchedBrand = resolveBrandMatch(product);
      const payload = { 
        notes: 'Approved via Dashboard', 
        ...(mappedBrandName && { mappedBrand: mappedBrandName }),
        ...(!mappedBrandName && matchedBrand && { mappedBrand: matchedBrand })
      };

      try {
        const res = await fetch(`/api/admin/sync/approve/${id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok && data?.success) success++; else failed++;
      } catch (e) { failed++; }
    }
    
    setBatchApproving(false);
    setSelectedIds([]);
    setIsSelectionMode(false);
    setMessage({ type: failed ? 'error' : 'success', text: `Action completed for ${success} items${failed ? `, ${failed} failed` : ''}` });
    await fetchStagingProducts();
  };

  const handleApprove = (stagingId: number) => validateAndApprove([stagingId]);
  const handleApproveSelected = () => validateAndApprove(selectedIds);
  const handleApproveAllVisible = () => validateAndApprove(stagingProducts.map(p => p.id));

  const archiveIdsSequential = async (ids: number[]) => {
    if (!ids.length) return { success: 0, failed: ids.length };
    setBatchApproving(true);
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || '';
    let success = 0; let failed = 0;
    
    for (const id of ids) {
      try {
        const res = await fetch(`/api/admin/sync/archive/${id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data?.success) success++; else failed++;
      } catch (e) { failed++; }
    }
    setBatchApproving(false);
    await fetchStagingProducts();
    return { success, failed };
  };

  const handleArchiveSelected = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`Delete ${selectedIds.length} selected items from live store?`)) return;
    const { success, failed } = await archiveIdsSequential(selectedIds);
    setSelectedIds([]);
    setIsSelectionMode(false);
    setMessage({ type: failed ? 'error' : 'success', text: `Deleted ${success} items${failed ? `, ${failed} failed` : ''}` });
  };

  const handleArchiveAllVisible = async () => {
    const ids = stagingProducts.map(p => p.id);
    if (!ids.length) return;
    if (!confirm(`Delete all ${ids.length} visible items from live store?`)) return;
    const { success, failed } = await archiveIdsSequential(ids);
    setMessage({ type: failed ? 'error' : 'success', text: `Deleted ${success} items${failed ? `, ${failed} failed` : ''}` });
  };

  const rejectIdsSequential = async (ids: number[]) => {
    if (!ids.length) return { success: 0, failed: ids.length };
    setBatchRejecting(true);
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || '';
    let success = 0; let failed = 0;
    
    for (const id of ids) {
      try {
        const res = await fetch(`/api/admin/sync/reject/${id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ reason: 'Batch ignored via Dashboard' })
        });
        const data = await res.json();
        if (res.ok && data?.success) success++; else failed++;
      } catch (e) { failed++; }
    }
    setBatchRejecting(false);
    await fetchStagingProducts();
    return { success, failed };
  };

  const handleReject = async (stagingId: number) => {
    setRejecting(stagingId);
    const { success } = await rejectIdsSequential([stagingId]);
    if (success) setMessage({ type: 'success', text: 'Item ignored and removed.' });
    else setMessage({ type: 'error', text: `Failed to ignore item.` });
    setRejecting(null);
  };

  const handleIgnoreSelected = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`Ignore ${selectedIds.length} selected items?`)) return;
    const { success, failed } = await rejectIdsSequential(selectedIds);
    setSelectedIds([]);
    setIsSelectionMode(false);
    setMessage({ type: failed ? 'error' : 'success', text: `Ignored ${success} items${failed ? `, ${failed} failed` : ''}` });
  };

  const handleArchive = async (stagingId: number) => {
    setApproving(stagingId);
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const response = await fetch(`/api/admin/sync/archive/${stagingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Archive failed');

      if (data.success) {
        setMessage({ type: 'success', text: `Product archived from live store!` });
        fetchStagingProducts();
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: `Failed to archive: ${error.message}` });
    } finally {
      setApproving(null);
    }
  };

  const toggleSelectMode = () => {
    if (isSelectionMode) {
      setSelectedIds([]); 
    }
    setIsSelectionMode(!isSelectionMode);
  };

  const toggleSelect = (id: number) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleSelectAllVisible = () => {
    const visibleIds = stagingProducts.map(p => p.id);
    const allSelected = visibleIds.every(id => selectedIds.includes(id)) && visibleIds.length > 0;
    if (allSelected) setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
    else setSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])));
  };

  const visibleAllSelected = stagingProducts.length > 0 && stagingProducts.every(p => selectedIds.includes(p.id));

  const validBulkIds = brandValidationModal.isOpen && brandValidationModal.isBulk 
    ? brandValidationModal.stagingIds.filter(id => {
        const product = allStagingProducts.find(p => p.id === id) || stagingProducts.find(p => p.id === id);
        if (!product) return false;
        const bName = (product.raw_brand_name || '').trim();
        const matchedBrand = resolveBrandMatch(product);
        const brandExists = Boolean(matchedBrand) || dbBrands.some(b => b.name.toLowerCase() === bName.toLowerCase());
        const isUnbranded = bName.toLowerCase() === 'unbranded' || bName === '';
        return brandExists || isUnbranded;
      })
    : [];

  const filteredBrands = dbBrands.filter(b => 
    b.name.toLowerCase().includes(brandSearchQuery.toLowerCase())
  );

  // 🔥 ACTION HANDLERS FOR BRAND FILTER 🔥
  const toggleBrandFilter = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const clearBrandFilter = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBrands([]);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-12 font-sans">
      <div className={`fixed top-6 right-6 z-50 transition-all duration-500 transform ${message ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0 pointer-events-none'}`}>
        {message && (
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg border backdrop-blur-md ${message.type === 'success' ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800' : 'bg-red-50/90 border-red-200 text-red-800'}`}>
            {message.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
            <span className="font-medium text-sm tracking-wide">{message.text}</span>
          </div>
        )}
      </div>

      {brandValidationModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-visible animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                <AlertCircle size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Unrecognized Brands Found</h3>
                <p className="text-sm text-slate-500">Manual review required</p>
              </div>
            </div>
            
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-visible">
              {brandValidationModal.isBulk ? (
                <>
                  <p className="text-sm text-slate-700">
                    You selected multiple items, but some of them contain brands that do not exist in your database:
                  </p>
                  <div className="flex flex-wrap gap-2 my-2">
                    {brandValidationModal.rawBrands.map(b => (
                      <span key={b} className="bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-md text-xs font-bold shadow-sm">
                        {b}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-slate-700">
                    You can skip the unrecognized items for now and <strong>Approve Valid Only</strong>, or create the missing brands first.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-700">
                    The scraped brand <span className="font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded shadow-sm">"{brandValidationModal.rawBrands[0]}"</span> does not exist in your database.
                  </p>
                  
                  <div className="space-y-2 mt-4 relative">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Map to existing brand
                    </label>
                    
                    <div className="relative">
                      <div 
                        className={`w-full px-4 py-3 bg-white border rounded-xl text-sm flex justify-between items-center cursor-pointer transition-colors shadow-sm ${isBrandDropdownOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200 hover:bg-slate-50'}`}
                        onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)}
                      >
                        <span className={selectedMappedBrand ? "text-slate-900 font-medium" : "text-slate-400"}>
                          {selectedMappedBrand || "-- Select an existing brand --"}
                        </span>
                        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isBrandDropdownOpen ? 'rotate-180' : ''}`} />
                      </div>

                      {isBrandDropdownOpen && (
                        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl flex flex-col overflow-hidden">
                          <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                            <div className="relative">
                              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input 
                                type="text" 
                                placeholder="Search brand..." 
                                value={brandSearchQuery}
                                onChange={(e) => setBrandSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow"
                                onClick={(e) => e.stopPropagation()} 
                              />
                            </div>
                          </div>
                          <div className="overflow-y-auto max-h-52 py-1">
                            <div 
                              className="px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer font-medium transition-colors"
                              onClick={() => { setSelectedMappedBrand('Unbranded'); setIsBrandDropdownOpen(false); setBrandSearchQuery(''); }}
                            >
                              Unbranded
                            </div>
                            {filteredBrands.map(b => (
                              <div 
                                key={b.id}
                                className="px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer transition-colors"
                                onClick={() => { setSelectedMappedBrand(b.name); setIsBrandDropdownOpen(false); setBrandSearchQuery(''); }}
                              >
                                {b.name}
                              </div>
                            ))}
                            {filteredBrands.length === 0 && (
                              <div className="px-4 py-4 text-sm text-slate-400 text-center italic">No brands found matching "{brandSearchQuery}"</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={() => {
                  setBrandValidationModal({ isOpen: false, stagingIds: [], rawBrands: [], isBulk: false });
                  setSelectedMappedBrand('');
                  setIsBrandDropdownOpen(false);
                  setBrandSearchQuery('');
                }}
                className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 hover:text-slate-900 rounded-lg transition-colors"
              >
                Cancel
              </button>
              
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <a 
                  href="/admin/brands/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors shadow-sm"
                >
                  Create Brand <ExternalLink size={14} />
                </a>

                {brandValidationModal.isBulk ? (
                  <button
                    onClick={() => proceedWithApproval(validBulkIds)}
                    disabled={validBulkIds.length === 0} 
                    className="flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {validBulkIds.length > 0 
                      ? `Approve Valid Only (${validBulkIds.length})` 
                      : 'No Valid Items'}
                  </button>
                ) : (
                  <button
                    onClick={() => proceedWithApproval(brandValidationModal.stagingIds, selectedMappedBrand)}
                    disabled={!selectedMappedBrand}
                    className="flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Map & Approve
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-6 pt-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Catalog Sync</h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">Review and approve updates from your latest scrape.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
               <select 
                 value={scrapeCategory}
                 onChange={(e) => setScrapeCategory(e.target.value)}
                 disabled={isScraping}
                 className="appearance-none bg-transparent px-4 py-2.5 text-sm font-medium text-slate-700 outline-none cursor-pointer border-r border-slate-200 hover:bg-slate-50 transition-colors"
               >
                 <option value="watches">Watches</option>
                 <option value="jewellery">Jewellery</option>
                 <option value="bags">Bags</option>
                 <option value="all">All Categories</option>
               </select>

              <button 
                onClick={handleRunScraper} 
                disabled={isScraping}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isScraping ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                {isScraping ? 'Scraping...' : 'Run Scraper'}
              </button>
            </div>

            <button onClick={fetchStagingProducts} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm group">
              <RefreshCw size={16} className={`group-hover:rotate-180 transition-transform duration-500 ${loading ? 'animate-spin' : ''}`} /> 
              Refresh View
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { id: 'new', label: 'New Arrivals', count: stats.newProducts, icon: PackagePlus, color: 'text-indigo-600', bg: 'bg-indigo-50', activeColor: 'ring-indigo-600' },
            { id: 'updates', label: 'Price Updates', count: stats.priceUpdates, icon: Tag, color: 'text-amber-600', bg: 'bg-amber-50', activeColor: 'ring-amber-500' },
            { id: 'archive', label: 'Missing / Archive', count: stats.toArchive, icon: ArchiveX, color: 'text-rose-600', bg: 'bg-rose-50', activeColor: 'ring-rose-500' },
            { id: 'all', label: 'All Pending', count: stats.total, icon: Layers, color: 'text-slate-700', bg: 'bg-slate-100', activeColor: 'ring-slate-900' }
          ].map((stat) => (
            <button
              key={stat.id}
              onClick={() => { setFilter(stat.id as any); setIsSelectionMode(false); setSelectedIds([]); }}
              className={`relative overflow-hidden flex flex-col p-5 rounded-2xl border text-left transition-all duration-300 ${filter === stat.id ? `bg-white shadow-md ring-2 border-transparent ${stat.activeColor}` : 'bg-white border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-500">{stat.label}</span>
                <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                  <stat.icon size={18} strokeWidth={2} />
                </div>
              </div>
              <span className={`text-3xl font-bold tracking-tight ${filter === stat.id ? 'text-slate-900' : 'text-slate-700'}`}>{stat.count}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            
            <div className="relative w-full sm:w-64 lg:w-80 group">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search product or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 hover:bg-slate-100 transition-all text-slate-700 placeholder:text-slate-400 placeholder:font-normal"
              />
            </div>

            <div className="hidden sm:block w-px h-6 bg-slate-200 mx-1"></div>

            <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500">
              <Filter size={16} />
              <span className="text-sm font-medium">Filters</span>
            </div>
            
            {/* 🔥 WORKING MULTI-SELECT BRAND FILTER UI 🔥 */}
            <div className="relative inline-flex items-center" ref={brandFilterRef}>
              <div 
                className={`bg-white border text-sm font-medium rounded-lg pl-4 pr-10 py-2.5 cursor-pointer shadow-sm w-44 md:w-56 flex items-center justify-between transition-all ${isBrandFilterOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20 text-slate-900' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                onClick={() => setIsBrandFilterOpen(!isBrandFilterOpen)}
              >
                <div className="truncate pr-2">
                  {selectedBrands.length === 0 
                    ? "All Brands" 
                    : selectedBrands.length === 1 
                      ? selectedBrands[0] 
                      : `${selectedBrands.length} Brands Selected`}
                </div>
                
                {selectedBrands.length > 0 ? (
                  <div 
                    onClick={clearBrandFilter} 
                    className="absolute right-8 text-slate-400 hover:text-rose-500 transition-colors p-1"
                  >
                    <X size={14} />
                  </div>
                ) : null}
                <ChevronDown size={16} className={`absolute right-3 text-slate-400 pointer-events-none transition-transform duration-200 ${isBrandFilterOpen ? 'rotate-180' : ''}`} />
              </div>

              {isBrandFilterOpen && (
                <div className="absolute top-full mt-2 left-0 z-40 w-56 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="max-h-60 overflow-y-auto py-1 hide-scrollbar">
                    {brandOptions.length === 0 ? (
                       <div className="px-4 py-3 text-sm text-slate-400 text-center italic">No brands available</div>
                    ) : (
                      brandOptions.map(b => (
                        <div 
                          key={b} 
                          onClick={() => toggleBrandFilter(b)}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors group"
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedBrands.includes(b) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 group-hover:border-indigo-400'}`}>
                            {selectedBrands.includes(b) && <Check size={12} className="text-white" strokeWidth={3} />}
                          </div>
                          <span className={`text-sm ${selectedBrands.includes(b) ? 'font-semibold text-slate-900' : 'font-medium text-slate-600'}`}>{b}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative inline-flex items-center">
              <select
                value={categoryFilter || ''}
                onChange={(e) => setCategoryFilter(e.target.value || null)}
                className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 hover:bg-slate-50 transition-all cursor-pointer shadow-sm w-44"
              >
                <option value="">All Categories</option>
                {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-3 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 hide-scrollbar">
            <button 
              onClick={toggleSelectMode} 
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all shadow-sm border ${isSelectionMode ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
            >
              {isSelectionMode ? <X size={16} /> : <ListChecks size={16} />}
              {isSelectionMode ? 'Cancel Selection' : 'Select Multiple'}
            </button>

            {isSelectionMode && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="w-px h-6 bg-slate-200 mx-1"></div>
                {selectedIds.length > 0 && (
                  <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-md">
                    {selectedIds.length} Selected
                  </span>
                )}
                
                {/* 🚀 DYNAMIC ACTION BUTTONS FOR SELECTION */}
                {filter === 'archive' ? (
                  <button onClick={handleArchiveSelected} disabled={!selectedIds.length || batchApproving} className="px-4 py-2.5 text-sm font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-rose-600 text-white hover:bg-rose-700 shadow-sm">
                    Delete
                  </button>
                ) : filter === 'updates' ? (
                  <button onClick={handleApproveSelected} disabled={!selectedIds.length || batchApproving} className="px-4 py-2.5 text-sm font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-amber-500 text-white hover:bg-amber-600 shadow-sm">
                    Update
                  </button>
                ) : (
                  <button onClick={handleApproveSelected} disabled={!selectedIds.length || batchApproving} className="px-4 py-2.5 text-sm font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm">
                    Approve
                  </button>
                )}

                <button onClick={handleIgnoreSelected} disabled={!selectedIds.length || batchRejecting} className="px-4 py-2.5 text-sm font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-rose-600">
                  Ignore
                </button>
              </div>
            )}

            {!isSelectionMode && (
              <>
                <div className="w-px h-6 bg-slate-200 mx-1"></div>
                {/* 🚀 DYNAMIC ACTION BUTTONS FOR ALL VISIBLE */}
                {filter === 'archive' ? (
                  <button onClick={handleArchiveAllVisible} disabled={!stagingProducts.length || batchApproving} className="px-4 py-2.5 text-sm font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-rose-600 text-white hover:bg-rose-700 shadow-sm hover:shadow">
                    Delete All Visible
                  </button>
                ) : filter === 'updates' ? (
                  <button onClick={handleApproveAllVisible} disabled={!stagingProducts.length || batchApproving} className="px-4 py-2.5 text-sm font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-slate-900 text-white hover:bg-slate-800 shadow-sm hover:shadow">
                    Update All Visible
                  </button>
                ) : (
                  <button onClick={handleApproveAllVisible} disabled={!stagingProducts.length || batchApproving} className="px-4 py-2.5 text-sm font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-slate-900 text-white hover:bg-slate-800 shadow-sm hover:shadow">
                    Approve All Visible
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-80 space-y-4">
              <Loader2 className="animate-spin text-indigo-500" size={32} />
              <p className="text-sm font-medium text-slate-500 tracking-wide">Syncing catalog data...</p>
            </div>
          ) : stagingProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 text-slate-400">
              <div className="bg-slate-50 p-4 rounded-full mb-4 border border-slate-100">
                <Check className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-base font-semibold text-slate-600">You're all caught up!</p>
              <p className="text-sm mt-1">No pending products found for this view.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200">
                    {isSelectionMode && (
                      <th className="py-4 pl-6 w-12 animate-in fade-in slide-in-from-left-2 text-center">
                        <div className="flex items-center justify-center">
                          <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer" checked={visibleAllSelected} onChange={toggleSelectAllVisible} />
                        </div>
                      </th>
                    )}
                    
                    <th className={`px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center ${!isSelectionMode ? 'pl-8' : ''}`}>Product Info</th>
                    
                    <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Category</th>
                    
                    {filter !== 'archive' && (
                      <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                    )}
                    
                    <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                      {filter === 'archive' ? 'Status' : filter === 'updates' ? 'Price Change' : 'Price'}
                    </th>
                    
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stagingProducts.map((product) => (
                    <tr key={product.id} className="group hover:bg-slate-50/80 transition-colors duration-200">
                      {isSelectionMode && (
                        <td className="py-4 pl-6 animate-in fade-in slide-in-from-left-2">
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer transition-all"
                              checked={selectedIds.includes(product.id)}
                              onChange={() => toggleSelect(product.id)}
                            />
                          </div>
                        </td>
                      )}
                      
                      <td className={`px-4 py-4 ${!isSelectionMode ? 'pl-8' : ''}`}>
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-center">{product.scraped_name}</span>
                          <span className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider text-center">{product.scraped_ref_no}</span>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-semibold uppercase tracking-wider">
                            {product.raw_category_name || 'Uncategorized'}
                          </span>
                        </div>
                      </td>

                      {filter !== 'archive' && (
                        <td className="px-4 py-4">
                          <div className="flex justify-center">
                            {product.is_archive ? (
                               <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100/50">To Archive</span>
                            ) : product.local_product ? (
                               <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100/50">Existing</span>
                            ) : (
                               <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100/50">New Arrival</span>
                            )}
                          </div>
                        </td>
                      )}

                      <td className="px-4 py-4">
                        <div className="flex flex-col items-center justify-center gap-1">
                          {product.is_archive ? (
                            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-rose-600">
                              <Trash2 size={14} /> Missing
                            </div>
                          ) : product.is_price_change && product.local_product ? (
                            <>
                              <span className="text-xs font-medium text-slate-400 line-through decoration-slate-300 text-center">AED {Number(product.local_product.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              <div className={`flex items-center justify-center gap-1.5 text-sm font-bold ${Number(product.scraped_price) > Number(product.local_product.price) ? 'text-emerald-600' : 'text-rose-600'}`}>
                                AED {Number(product.scraped_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                {Number(product.scraped_price) > Number(product.local_product.price) ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                              </div>
                            </>
                          ) : (
                            <span className="text-sm font-bold text-slate-900 text-center">AED {Number(product.scraped_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {product.is_archive ? (
                            <button
                              onClick={() => handleArchive(product.id)}
                              disabled={approving === product.id}
                              className="flex items-center justify-center p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors disabled:opacity-50 border border-transparent hover:border-rose-200"
                              title="Archive Product"
                            >
                              {approving === product.id ? <Loader2 size={16} className="animate-spin" /> : <ArchiveX size={16} strokeWidth={2.5} />}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleApprove(product.id)}
                              disabled={approving === product.id}
                              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all disabled:opacity-50 shadow-sm ${product.is_price_change ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                            >
                              {approving === product.id ? <Loader2 size={14} className="animate-spin" /> : (product.is_price_change ? <RefreshCw size={14} strokeWidth={2.5}/> : <Check size={14} strokeWidth={2.5} />)}
                              {product.is_price_change ? 'Update' : 'Approve'}
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleReject(product.id)}
                            disabled={rejecting === product.id}
                            className="flex items-center justify-center p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50 border border-transparent hover:border-rose-100"
                            title="Ignore Item"
                          >
                            {rejecting === product.id ? <Loader2 size={16} className="animate-spin" /> : <X size={16} strokeWidth={2.5} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}