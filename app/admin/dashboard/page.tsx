'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
// 1. Import the professional Inter font from Next.js
import { Inter } from 'next/font/google';
import { 
  LayoutDashboard, 
  Package, 
  Tags, 
  Settings, 
  ChevronRight,
  Activity,
  Globe
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// 2. Initialize the font
const inter = Inter({ subsets: ['latin'], display: 'swap' });

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface DashboardStats {
  totalProducts: number;
  totalBrands: number;
  totalCategories: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  
  // States for Kuwait Time
  const [kuwaitTime, setKuwaitTime] = useState<string>('');
  const [kuwaitDay, setKuwaitDay] = useState<string>('');
  const [kuwaitDate, setKuwaitDate] = useState<string>('');

  // Hyper-smooth entrance trigger
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Real-time Kuwait Clock (Time, Day, and Date)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const optionsTime: Intl.DateTimeFormatOptions = { 
        timeZone: 'Asia/Kuwait', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
      };
      const optionsDay: Intl.DateTimeFormatOptions = { 
        timeZone: 'Asia/Kuwait', weekday: 'long' 
      };
      const optionsDate: Intl.DateTimeFormatOptions = { 
        timeZone: 'Asia/Kuwait', month: 'short', day: 'numeric', year: 'numeric' 
      };

      setKuwaitTime(new Intl.DateTimeFormat('en-US', optionsTime).format(now));
      setKuwaitDay(new Intl.DateTimeFormat('en-US', optionsDay).format(now));
      setKuwaitDate(new Intl.DateTimeFormat('en-US', optionsDate).format(now));
    };
    
    updateTime(); 
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [productResponse, { count: brandCount }, { count: categoryCount }] = await Promise.all([
          fetch('/api/admin/products/list'),
          supabase.from('brand').select('*', { count: 'exact', head: true }),
          supabase.from('category').select('*', { count: 'exact', head: true })
        ]);

        let totalProducts = 0;
        if (productResponse.ok) {
          const data = await productResponse.json();
          const products = data.products || [];
          totalProducts = data.pagination?.total || products.length || 0;
        }

        setStats({
          totalProducts,
          totalBrands: brandCount || 0,
          totalCategories: categoryCount || 0,
        });

      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Shared ultra-smooth transition class
  const smoothCurve = "transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]";

  return (
    // 3. Apply the font class to the main wrapper
    <main className={`flex-1 bg-[#FAFAFA] min-h-screen p-4 sm:p-8 md:p-12 text-slate-900 overflow-x-hidden ${inter.className}`}>
      <div className={`max-w-[1200px] mx-auto ${smoothCurve} ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        
        {/* Header Section */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12 pb-6 border-b border-slate-200/60">
          <div className={`transform ${smoothCurve} delay-75 ${isMounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Command Center
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-2 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500" />
              Live overview of your luxury catalog
            </p>
          </div>

          {/* Expanded Premium Kuwait Time Widget */}
          <div className={`transform ${smoothCurve} delay-150 ${isMounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
            <div className="group relative flex items-center gap-4 px-5 py-3.5 bg-white/60 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:bg-white hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-indigo-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
              
              <div className="relative flex items-center justify-center">
                <Globe className="w-5 h-5 text-indigo-600 animate-[spin_10s_linear_infinite]" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white animate-pulse" />
              </div>
              
              <div className="flex flex-col border-r border-slate-200 pr-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">
                  Kuwait Time
                </span>
                <span className="text-sm font-bold text-slate-800 tabular-nums leading-none min-w-[85px]">
                  {kuwaitTime || 'Syncing...'}
                </span>
              </div>

              <div className="flex flex-col pl-1">
                <span className="text-xs font-semibold text-slate-700 leading-none mb-1">
                  {kuwaitDay || '...'}
                </span>
                <span className="text-xs font-medium text-slate-400 tabular-nums leading-none">
                  {kuwaitDate || '...'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12">
          {loading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white/60 border border-slate-100 h-[130px] rounded-2xl animate-pulse shadow-sm" />
              ))}
            </>
          ) : (
            <>
              <StatCard title="Total Products" value={stats?.totalProducts || 0} icon={Package} delay="delay-[100ms]" isMounted={isMounted} />
              <StatCard title="Total Brands" value={stats?.totalBrands || 0} icon={Tags} delay="delay-[200ms]" isMounted={isMounted} />
              <StatCard title="Categories" value={stats?.totalCategories || 0} icon={LayoutDashboard} delay="delay-[300ms]" isMounted={isMounted} />
            </>
          )}
        </div>

        {/* Quick Actions Section */}
        <div className={`${smoothCurve} delay-[400ms] ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="flex items-center gap-2 mb-6 px-1">
            <Settings className="w-4 h-4 text-slate-400" />
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Quick Modules
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <ActionCard href="/admin/products" title="Manage Products" description="Sync, edit, or archive catalog items." icon={Package} delay="delay-[450ms]" isMounted={isMounted} />
            <ActionCard href="/admin/brands" title="Manage Brands" description="Organize your portfolio of luxury brands." icon={Tags} delay="delay-[500ms]" isMounted={isMounted} />
            <ActionCard href="/admin/settings" title="Store Settings" description="Configure pricing rules and global logic." icon={Settings} delay="delay-[550ms]" isMounted={isMounted} />
          </div>
        </div>
      </div>
    </main>
  );
}

// --- Subcomponents ---

interface StatCardProps {
  title: string;
  value: number;
  icon: any;
  delay: string;
  isMounted: boolean;
}

function StatCard({ title, value, icon: Icon, delay, isMounted }: StatCardProps) {
  const smoothCurve = "transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]";
  
  return (
    <div className={`group relative bg-white rounded-2xl p-6 border border-slate-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:-translate-y-1.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] hover:border-indigo-200 ${smoothCurve} ${isMounted ? `opacity-100 translate-y-0 ${delay}` : 'opacity-0 translate-y-8'}`}>
      
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-slate-500 group-hover:text-indigo-600 transition-colors duration-500">
          {title}
        </h3>
        <div className={`p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:scale-110 group-hover:-rotate-3 ${smoothCurve}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      <div className="flex items-end justify-between">
        <p className="text-4xl font-extrabold text-slate-900 tracking-tighter tabular-nums">
          {value.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

interface ActionCardProps {
  href: string;
  title: string;
  description: string;
  icon: any;
  delay: string;
  isMounted: boolean;
}

function ActionCard({ href, title, description, icon: Icon, delay, isMounted }: ActionCardProps) {
  const smoothCurve = "transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]";

  return (
    <Link 
      href={href}
      className={`group relative flex flex-col p-6 bg-white rounded-2xl border border-slate-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] hover:border-indigo-300 ${smoothCurve} ${isMounted ? `opacity-100 translate-y-0 ${delay}` : 'opacity-0 translate-y-8'}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 ${smoothCurve}`} />

      <div className="relative">
        <div className={`w-12 h-12 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-600 mb-5 group-hover:bg-indigo-600 group-hover:border-indigo-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-indigo-500/30 ${smoothCurve}`}>
          <Icon className="w-6 h-6" />
        </div>
        
        <h3 className="text-lg font-bold text-slate-900 mb-2 tracking-tight">
          {title}
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed max-w-[90%]">
          {description}
        </p>
      </div>

      <div className={`absolute bottom-6 right-6 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 ${smoothCurve}`}>
        <ChevronRight className="w-4 h-4 text-indigo-600" />
      </div>
    </Link>
  );
}