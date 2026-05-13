'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
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
  ListChecks
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
  
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
  const [brandFilter, setBrandFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  
  const [filter, setFilter] = useState<'new' | 'updates' | 'archive' | 'all'>('new');
  const [stats, setStats] = useState({ total: 0, newProducts: 0, priceUpdates: 0, toArchive: 0 });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
      const { data: stagingData, error: stagingError } = await supabase
        .from('staging_products')
        .select('*')
        .in('sync_status', ['pending', 'missing'])
        .order('created_at', { ascending: false });

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

      const refNos = stagingData.map(p => p.scraped_ref_no).filter(Boolean);
      const { data: localProducts } = await supabase
        .from('product')
        .select('id, ref_no, price')
        .in('ref_no', refNos);

      let newCount = 0;
      let updateCount = 0;
      let archiveCount = 0;

      const enrichedData: StagingProduct[] = stagingData.map(staging => {
        const local = localProducts?.find(p => p.ref_no === staging.scraped_ref_no);
        const isArchive = local && (!staging.scraped_price || staging.sync_status === 'missing');
        const isPriceChange = local && !isArchive && Number(local.price) !== Number(staging.scraped_price);
        const isNew = !local;

        if (isNew) newCount++;
        else if (isArchive) archiveCount++;
        else if (isPriceChange) updateCount++;

        return { ...staging, local_product: local || null, is_price_change: isPriceChange, is_archive: isArchive };
      });

      const brands = Array.from(new Set(stagingData.map((s: any) => s.raw_brand_name).filter(Boolean)));
      const cats = Array.from(new Set(stagingData.map((s: any) => s.raw_category_name).filter(Boolean)));

      setBrandOptions(brands);
      setCategoryOptions(cats);
      setAllStagingProducts(enrichedData);

      let filteredData = enrichedData;
      if (brandFilter) filteredData = filteredData.filter(p => p.raw_brand_name === brandFilter);
      if (categoryFilter) filteredData = filteredData.filter(p => p.raw_category_name === categoryFilter);
      if (filter === 'new') filteredData = enrichedData.filter(p => !p.local_product);
      else if (filter === 'updates') filteredData = enrichedData.filter(p => p.is_price_change);
      else if (filter === 'archive') filteredData = enrichedData.filter(p => p.is_archive);

      setStagingProducts(filteredData);
      setStats({ total: stagingData.length, newProducts: newCount, priceUpdates: updateCount, toArchive: archiveCount });
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Failed to load data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStagingProducts(); }, [filter]);

  useEffect(() => {
    if (!allStagingProducts.length) return;
    let filtered = allStagingProducts;
    if (filter === 'new') filtered = allStagingProducts.filter(p => !p.local_product);
    else if (filter === 'updates') filtered = allStagingProducts.filter(p => p.is_price_change);
    else if (filter === 'archive') filtered = allStagingProducts.filter(p => p.is_archive);

    if (brandFilter) filtered = filtered.filter(p => p.raw_brand_name === brandFilter);
    if (categoryFilter) filtered = filtered.filter(p => p.raw_category_name === categoryFilter);

    setStagingProducts(filtered);
  }, [brandFilter, categoryFilter, filter, allStagingProducts]);

  const approveIdsSequential = async (ids: number[]) => {
    if (!ids.length) return { success: 0, failed: ids.length };
    setBatchApproving(true);
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || '';
    let success = 0; let failed = 0;
    
    for (const id of ids) {
      try {
        const res = await fetch(`/api/admin/sync/approve/${id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ notes: 'Batch approved via Dashboard' })
        });
        const data = await res.json();
        if (res.ok && data?.success) success++; else failed++;
      } catch (e) { failed++; }
    }
    setBatchApproving(false);
    await fetchStagingProducts();
    return { success, failed };
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

  const handleApprove = async (stagingId: number) => {
    setApproving(stagingId);
    const { success } = await approveIdsSequential([stagingId]);
    if (success) setMessage({ type: 'success', text: `Product successfully synced!` });
    else setMessage({ type: 'error', text: `Failed to approve product.` });
    setApproving(null);
  };

  const handleApproveSelected = async () => {
    if (!selectedIds.length) return;
    const { success, failed } = await approveIdsSequential(selectedIds);
    setSelectedIds([]);
    setIsSelectionMode(false);
    setMessage({ type: failed ? 'error' : 'success', text: `Approved ${success} items${failed ? `, ${failed} failed` : ''}` });
  };

  const handleApproveAllVisible = async () => {
    const ids = stagingProducts.map(p => p.id);
    if (!ids.length) return;
    const { success, failed } = await approveIdsSequential(ids);
    setSelectedIds([]);
    setIsSelectionMode(false);
    setMessage({ type: failed ? 'error' : 'success', text: `Approved ${success} items${failed ? `, ${failed} failed` : ''}` });
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

      <div className="max-w-[1400px] mx-auto px-6 pt-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Catalog Sync</h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">Review and approve updates from your latest scrape.</p>
          </div>
          <button onClick={fetchStagingProducts} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm group">
            <RefreshCw size={16} className={`group-hover:rotate-180 transition-transform duration-500 ${loading ? 'animate-spin' : ''}`} /> 
            Refresh Data
          </button>
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
            <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500">
              <Filter size={16} />
              <span className="text-sm font-medium">Filters</span>
            </div>
            
            <div className="relative inline-flex items-center">
              <select
                value={brandFilter || ''}
                onChange={(e) => setBrandFilter(e.target.value || null)}
                className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 hover:bg-slate-50 transition-all cursor-pointer shadow-sm w-40"
              >
                <option value="">All Brands</option>
                {brandOptions.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-3 text-slate-400 pointer-events-none" />
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
                <button onClick={handleApproveSelected} disabled={!selectedIds.length || batchApproving} className="px-4 py-2.5 text-sm font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm">
                  Approve
                </button>
                <button onClick={handleIgnoreSelected} disabled={!selectedIds.length || batchRejecting} className="px-4 py-2.5 text-sm font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white border border-slate-200 text-rose-600 hover:bg-rose-50">
                  Ignore
                </button>
              </div>
            )}

            {!isSelectionMode && (
              <>
                <div className="w-px h-6 bg-slate-200 mx-1"></div>
                <button onClick={handleApproveAllVisible} disabled={!stagingProducts.length || batchApproving} className="px-4 py-2.5 text-sm font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-slate-900 text-white hover:bg-slate-800 shadow-sm hover:shadow">
                  Approve All Visible
                </button>
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
                    
                    {/* DYNAMIC COLUMNS (Hide on Archive tab) */}
                    {filter !== 'archive' && (
                      <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Category</th>
                    )}
                    {filter !== 'archive' && (
                      <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                    )}
                    
                    {/* DYNAMIC PRICE CHANGE HEADER */}
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

                      {/* DYNAMIC CELLS (Hide on Archive tab) */}
                      {filter !== 'archive' && (
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center">
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-semibold uppercase tracking-wider">
                              {product.raw_category_name || 'Uncategorized'}
                            </span>
                          </div>
                        </td>
                      )}

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

                      {/* ALWAYS VISIBLE PRICE/STATUS CELL */}
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