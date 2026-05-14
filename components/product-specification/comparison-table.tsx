'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, ArrowRight } from 'lucide-react';
import { Product } from '@/lib/types';
import { useComparison } from '@/contexts/ComparisonContext';

interface ComparisonTableProps {
  products: Product[];
}

export default function ComparisonTable({ products }: ComparisonTableProps) {
  const { removeFromComparison } = useComparison();

  useEffect(() => {
    console.log('📊 Comparison Table - Products received:', products.length);
  }, [products]);

  const extractSpecs = (description: string | null | undefined) => {
    const specs: Record<string, string> = {};
    if (!description) return specs;

    description.split('\n').forEach((line) => {
      if (line.includes(':') && line.split(':').length === 2) {
        const [key, value] = line.split(':');
        specs[key.trim()] = value.trim();
      }
    });

    return specs;
  };

  const allSpecKeys = Array.from(
    new Set(
      products.flatMap((product) => Object.keys(extractSpecs(product.description)))
    )
  );

  if (products.length === 0) {
    return null;
  }

  // Calculate width percentage dynamically based on product count
  // 15% for the labels, and the rest divided by product count
  const columnWidth = `${85 / Math.max(products.length, 1)}%`;

  return (
    <div className="w-full animate-fade-in font-sans">
      
      <div className="bg-white rounded-[1.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.03)] border border-slate-200 overflow-hidden w-full">
        
        {/* TANGGAL ANG OVERFLOW-X-AUTO DITO */}
        <div className="w-full">
          {/* GINAMIT ANG TABLE-FIXED PARA PUMANTAY ANG MGA COLUMNS */}
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-white">
                
                {/* Specs Header - Smaller padding and text */}
                <th className="px-4 py-6 text-left w-[15%] align-bottom border-b border-r border-slate-200 bg-slate-50">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
                    Specifications
                  </span>
                </th>

                {/* Product Columns - Adjusted for smaller content */}
                {products.map((product) => (
                  <th
                    key={product.id}
                    style={{ width: columnWidth }}
                    className="px-3 py-6 text-center border-b border-slate-100 relative group align-top bg-white"
                  >
                    {/* Smaller Remove Button */}
                    <button
                      onClick={() => removeFromComparison(product.id)}
                      className="absolute top-3 right-3 p-1.5 bg-white/90 backdrop-blur-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 border border-slate-100"
                      title="Remove from comparison"
                    >
                      <X size={14} strokeWidth={2.5} />
                    </button>

                    {/* Smaller Image (w-28 h-28 instead of 40) */}
                    <Link href={`/products/${product.id}`} className="block relative group/image">
                      <div className="relative aspect-square w-28 h-28 mx-auto mb-4 bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100 flex items-center justify-center">
                        {product.image_1 ? (
                          <Image
                            src={
                              product.image_1.startsWith('http')
                                ? product.image_1
                                : `${process.env.NEXT_PUBLIC_R2_DOMAIN}/${product.image_1}`
                            }
                            alt={product.name}
                            fill
                            sizes="112px"
                            className="object-cover group-hover/image:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 gap-1">
                            <span className="text-[10px] font-semibold">No Image</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Smaller Text */}
                      <h3 className="font-bold text-slate-900 text-xs hover:text-slate-600 transition-colors line-clamp-2 px-1 leading-snug h-8">
                        {product.name}
                      </h3>
                    </Link>

                    <p className="text-[9px] text-slate-400 mt-1 mb-3 font-mono tracking-widest uppercase truncate">{product.ref_no || 'N/A'}</p>

                    <div className="mb-4">
                      <p className="text-sm font-bold text-slate-900 tracking-tight">
                        AED {(product.sale_price ?? product.price)?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                      </p>
                    </div>

                    <Link
                      href={`/products/${product.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-900 text-slate-600 hover:text-white rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all group/link"
                    >
                      View Details <ArrowRight size={12} className="group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              
              {/* Brand */}
              <tr className="group hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest bg-slate-50 border-r border-slate-200">
                  Brand
                </td>
                {products.map((product) => (
                  <td key={product.id} className="px-3 py-4 text-center bg-white group-hover:bg-slate-50/50">
                    <span className="font-medium text-slate-900 text-xs truncate block">{product.brand?.name || 'Unbranded'}</span>
                  </td>
                ))}
              </tr>

              {/* Color */}
              <tr className="group hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest bg-slate-50 border-r border-slate-200">
                  Color
                </td>
                {products.map((product) => (
                  <td key={product.id} className="px-3 py-4 text-center bg-white group-hover:bg-slate-50/50">
                    <div className="flex items-center justify-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shadow-sm ring-1 ring-black/10"
                        style={{ backgroundColor: getColorFromName(product.color || '') }}
                      />
                      <span className="font-medium text-slate-900 text-xs truncate">{product.color || 'N/A'}</span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Gender */}
              <tr className="group hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest bg-slate-50 border-r border-slate-200">
                  Gender
                </td>
                {products.map((product) => (
                  <td key={product.id} className="px-3 py-4 text-center bg-white group-hover:bg-slate-50/50">
                    <span className="font-medium text-slate-900 text-xs">{product.gender || 'N/A'}</span>
                  </td>
                ))}
              </tr>

              {/* Category */}
              <tr className="group hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest bg-slate-50 border-r border-slate-200">
                  Category
                </td>
                {products.map((product) => (
                  <td key={product.id} className="px-3 py-4 text-center bg-white group-hover:bg-slate-50/50">
                    <span className="font-medium text-slate-900 text-xs truncate block">{product.category?.name || 'N/A'}</span>
                  </td>
                ))}
              </tr>

              {/* Dynamic Specifications */}
              {allSpecKeys.map((specKey) => (
                <tr key={specKey} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest bg-slate-50 border-r border-slate-200">
                    {specKey}
                  </td>
                  {products.map((product) => {
                    const specs = extractSpecs(product.description);
                    const specValue = specs[specKey];

                    return (
                      <td key={product.id} className="px-3 py-4 text-center bg-white group-hover:bg-slate-50/50">
                        {specValue ? (
                          <span className="font-medium text-slate-900 text-xs line-clamp-2">{specValue}</span>
                        ) : (
                          <span className="text-slate-300 font-medium text-xs">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Helper function to convert color name to hex code
function getColorFromName(colorName: string): string {
  const colors: Record<string, string> = {
    black: '#000000',
    white: '#FFFFFF',
    red: '#FF0000',
    blue: '#0000FF',
    green: '#00FF00',
    yellow: '#FFFF00',
    gold: '#FFD700',
    silver: '#C0C0C0',
    rose: '#FF007F',
    'rose gold': '#B76E79',
    'white gold': '#F0F8FF',
    'yellow gold': '#FFD700',
  };

  return colors[colorName.toLowerCase()] || '#E2E8F0'; 
}
