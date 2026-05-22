'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product } from '@/lib/types';

interface ComparisonContextType {
  comparisonProducts: Product[];
  addToComparison: (product: Product) => void;
  removeFromComparison: (productId: number) => void;
  clearComparison: () => void;
  isInComparison: (productId: number) => boolean;
  maxComparisonItems: number;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

// Helper to serialize products safely (only essential fields)
// Helper to serialize products safely (Sina-save na natin nang buo para walang maiwang data)
const serializeProducts = (products: Product[]) => {
  try {
    return JSON.stringify(products);
  } catch (error) {
    console.error('Failed to serialize products:', error);
    return '[]';
  }
};

// Helper to deserialize products
const deserializeProducts = (json: string): Product[] => {
  try {
    return JSON.parse(json);
  } catch (error) {
    console.error('Failed to deserialize products:', error);
    return [];
  }
};

export function ComparisonProvider({ children }: { children: React.ReactNode }) {
  const [comparisonProducts, setComparisonProducts] = useState<Product[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const maxComparisonItems = 4;

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('comparisonProducts');
      if (stored) {
        const products = deserializeProducts(stored);
        setComparisonProducts(products);
        console.log('✓ Loaded comparison products from localStorage:', products.length);
      }
    } catch (error) {
      console.error('Failed to load comparison products from localStorage:', error);
    }
    setIsHydrated(true);
  }, []);

  // Save to localStorage whenever comparison changes (only after hydration)
  useEffect(() => {
    if (isHydrated && comparisonProducts.length > 0) {
      try {
        localStorage.setItem('comparisonProducts', serializeProducts(comparisonProducts));
        console.log('✓ Saved comparison products to localStorage:', comparisonProducts.length);
      } catch (error) {
        console.error('Failed to save comparison products:', error);
      }
    } else if (isHydrated && comparisonProducts.length === 0) {
      // Clear localStorage when comparison is empty
      localStorage.removeItem('comparisonProducts');
    }
  }, [comparisonProducts, isHydrated]);

  // Wrapped in useCallback to prevent infinite loops in useEffect dependencies
  const addToComparison = useCallback((product: Product) => {
    setComparisonProducts((prev) => {
      if (prev.some((p) => p.id === product.id)) {
        return prev;
      }
      if (prev.length >= maxComparisonItems) {
        console.warn('Max comparison items reached');
        return prev;
      }
      return [...prev, product];
    });
  }, [maxComparisonItems]);

  const removeFromComparison = useCallback((productId: number) => {
    setComparisonProducts((prev) => prev.filter((p) => p.id !== productId));
  }, []);

  const clearComparison = useCallback(() => {
    setComparisonProducts([]);
    localStorage.removeItem('comparisonProducts');
  }, []);

  const isInComparison = useCallback((productId: number) => {
    return comparisonProducts.some((p) => p.id === productId);
  }, [comparisonProducts]);

  return (
    <ComparisonContext.Provider
      value={{
        comparisonProducts,
        addToComparison,
        removeFromComparison,
        clearComparison,
        isInComparison,
        maxComparisonItems,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const context = useContext(ComparisonContext);
  if (!context) {
    throw new Error('useComparison must be used within a ComparisonProvider');
  }
  return context;
}