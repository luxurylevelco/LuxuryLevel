'use client';

import { useState, useEffect, useMemo, memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Plus, Check, Search, Filter, Loader2, Package, Tag } from 'lucide-react';
import { Product } from '@/lib/types';
import { useComparison } from '@/contexts/ComparisonContext';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProductId: number;
}

interface ProductCardProps {
  product: Product;
  inComparison: boolean;
  canAdd: boolean;
  onToggle: () => void;
}

// Memoized product card for optimization
const ProductCard = memo(function ProductCard({ product, inComparison, canAdd, onToggle }: ProductCardProps) {
  return (
    <div
      className={`group relative rounded-2xl p-4 cursor-pointer transition-all duration-300 border-2 ${
        inComparison
          ? 'border-slate-900 bg-slate-50/50 shadow-sm'
          : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50 hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.05)]'
      } ${!canAdd && !inComparison ? 'opacity-50 cursor-not-allowed grayscale-[50%]' : ''}`}
      onClick={() => {
        if (canAdd || inComparison) onToggle();
      }}
    >
      <div className="flex gap-4 items-center">
        {/* Product Image */}
        <div className="relative w-20 h-20 flex-shrink-0 bg-slate-100 border border-slate-100 rounded-xl overflow-hidden shadow-sm group-hover:shadow transition-all flex items-center justify-center">
          {product.image_1 ? (
            <Image
              src={
                product.image_1.startsWith('https://')
                  ? product.image_1
                  : `${process.env.NEXT_PUBLIC_R2_DOMAIN}/${product.image_1}`
              }
              alt={product.name}
              fill
              sizes="80px"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 text-[10px]">
              No Img
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0 py-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 truncate text-sm group-hover:text-slate-700 transition-colors">
                {product.name}
              </h3>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase mt-0.5 truncate">
                {product.ref_no || 'N/A'}
              </p>
            </div>
            
            {/* Selection Indicator */}
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 flex-shrink-0 mt-0.5 ${
                inComparison
                  ? 'bg-slate-900 border-slate-900 scale-110 shadow-sm'
                  : 'border-slate-200 group-hover:border-slate-400'
              }`}
            >
              <Check size={14} className={`transition-all duration-300 ${inComparison ? 'text-white scale-100 opacity-100' : 'scale-50 opacity-0'}`} strokeWidth={3} />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <p className="text-sm font-bold text-slate-900 mr-1">
              AED {(product.sale_price ?? product.price)?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </p>
            {product.brand?.name && (
              <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[10px] font-semibold uppercase tracking-wider truncate max-w-[100px]">
                {product.brand.name}
              </span>
            )}
            {product.category?.name && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-semibold uppercase tracking-wider truncate max-w-[100px]">
                {product.category.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default function ComparisonModal({
  isOpen,
  onClose,
  currentProductId,
}: ComparisonModalProps) {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]); 

  const { comparisonProducts, addToComparison, removeFromComparison, maxComparisonItems, isInComparison } = useComparison();

  // Auto-add current product to comparison when modal opens
  useEffect(() => {
    const autoAddCurrentProduct = async () => {
      if (isOpen && !isInComparison(currentProductId) && allProducts.length > 0) {
        const currentProduct = allProducts.find((p) => p.id === currentProductId);
        if (currentProduct) {
          addToComparison(currentProduct);
        }
      }
    };

    autoAddCurrentProduct();
  }, [isOpen, currentProductId, isInComparison, addToComparison, allProducts]);

  useEffect(() => {
    if (isOpen && allProducts.length === 0) {
      fetchProducts();
    }
  }, [isOpen, allProducts.length]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products/all');
      if (response.ok) {
        const data = await response.json();
        
        // Log product data for debugging
        console.log('📦 Fetched products:', data.length);
        const productsWithImages = data.filter((p: Product) => p.image_1);
        const productsWithoutImages = data.filter((p: Product) => !p.image_1);
        
        console.log(`✓ Products with images: ${productsWithImages.length}`);
        console.log(`✗ Products without images: ${productsWithoutImages.length}`);
        
        if (data.length > 0) {
          console.log('Sample product:', {
            id: data[0].id,
            name: data[0].name,
            image_1: data[0].image_1,
            price: data[0].price,
            brand: data[0].brand?.name,
            category: data[0].category?.name,
          });
        }
        
        // Store all products (including current product)
        setAllProducts(data);

        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(data.map((p: Product) => p.category?.name).filter(Boolean))
        ) as string[];
        setCategories(uniqueCategories);

        // Extract unique brands
        const uniqueBrands = Array.from(
          new Set(data.map((p: Product) => p.brand?.name).filter(Boolean))
        ) as string[];
        setBrands(uniqueBrands);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  // High-speed client-side filtering (Updated with Brand logic)
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      // Exclude products already in comparison
      if (isInComparison(product.id)) return false;
      
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.ref_no?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = !selectedCategory || product.category?.name === selectedCategory;
      const matchesBrand = !selectedBrand || product.brand?.name === selectedBrand;
      
      return matchesSearch && matchesCategory && matchesBrand;
    });
  }, [allProducts, searchTerm, selectedCategory, selectedBrand, comparisonProducts]);


  const handleAddToComparison = (product: Product) => {
    if (isInComparison(product.id)) {
      removeFromComparison(product.id);
    } else {
      addToComparison(product);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white rounded-[2rem] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-100 animate-slide-up">
        
        {/* Premium Header */}
        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-slate-100 bg-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-60 pointer-events-none"></div>
          
          <div className="relative">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Compare Catalog</h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Selected: {comparisonProducts.length} / {maxComparisonItems}
              </span>
              {comparisonProducts.length === maxComparisonItems && (
                <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-bold uppercase tracking-wider rounded-full border border-rose-100">
                  Max Reached
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="relative p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-xl transition-all"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Filters & Search - UPDATED LAYOUT */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="relative flex-1 group">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
              <input
                type="text"
                placeholder="Search by product name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-sm font-medium transition-all shadow-sm placeholder:text-slate-400 placeholder:font-normal"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 md:w-auto">
              {/* Brand Filter */}
              <div className="relative w-full sm:w-48">
                <Tag size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full pl-11 pr-10 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-sm font-medium transition-all shadow-sm appearance-none bg-right bg-no-repeat truncate"
                  style={{
                    backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22 viewBox=%220 0 12 8%22%3E%3Cpath fill=%22%23444%22 d=%22M0 0l6 8 6-8z%22/%3E%3C/svg%3E")',
                    backgroundPosition: 'right 1rem center',
                    backgroundSize: '12px'
                  }}
                >
                  <option value="">All Brands</option>
                  {brands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div className="relative w-full sm:w-48">
                <Filter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-11 pr-10 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-sm font-medium transition-all shadow-sm appearance-none bg-right bg-no-repeat truncate"
                  style={{
                    backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22 viewBox=%220 0 12 8%22%3E%3Cpath fill=%22%23444%22 d=%22M0 0l6 8 6-8z%22/%3E%3C/svg%3E")',
                    backgroundPosition: 'right 1rem center',
                    backgroundSize: '12px'
                  }}
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Products List */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-4">
              <Loader2 size={32} className="text-slate-300 animate-spin" />
              <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">Loading Catalog...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                <Package size={28} className="text-slate-300" />
              </div>
              <div>
                <p className="text-slate-900 font-bold">No products found</p>
                <p className="text-slate-500 text-sm mt-1">Try adjusting your search or filters.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProducts.map((product) => {
                const inComparison = isInComparison(product.id);
                const canAdd = comparisonProducts.length < maxComparisonItems;

                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    inComparison={inComparison}
                    canAdd={canAdd}
                    onToggle={() => handleAddToComparison(product)}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-white flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3.5 text-slate-500 font-bold text-sm rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all text-center"
          >
            Cancel
          </button>
          
          <div className="w-full sm:w-auto flex-1 flex justify-end">
            <Link
              href="/compare"
              onClick={(e) => {
                if (comparisonProducts.length === 0) e.preventDefault();
                else onClose();
              }}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm transition-all shadow-md ${
                comparisonProducts.length > 0 
                  ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:-translate-y-0.5' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              <Plus size={18} />
              Review Selection ({comparisonProducts.length})
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
