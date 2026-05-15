'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Save, Loader2, AlertCircle, Edit2, Package, DollarSign, Tag, Palette, Users } from 'lucide-react';
import { Product, Brand } from '@/lib/types';

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  brands: Brand[];
  categories: any[];
  onSave: (updatedProduct: Partial<Product>) => Promise<boolean>;
}

interface EditFormData {
  name: string;
  ref_no: string;
  color: string;
  gender: string;
  description: string;
  brandId: string;
  categoryId: string;
  price: string;
  salePrice: string;
  saleStartDate: string;
  saleEndDate: string;
}

export default function ProductDetailsModal({
  isOpen,
  onClose,
  product,
  brands,
  categories,
  onSave,
}: ProductDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  
  // 🚀 THE FIX 1: Gumawa ng state para sa Parent Category
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<EditFormData>({
    name: '',
    ref_no: '',
    color: '',
    gender: '',
    description: '',
    brandId: '',
    categoryId: '',
    price: '',
    salePrice: '',
    saleStartDate: '',
    saleEndDate: '',
  });

  // 🚀 THE FIX 2: Dynamic na pag-filter ng Parent at Subcategories
  const parentCategories = categories.filter(cat => cat.parent_id === null);
  const availableSubCategories = selectedParentId 
    ? categories.filter(cat => cat.parent_id === selectedParentId) 
    : [];

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        ref_no: product.ref_no || '',
        color: product.color || '',
        gender: product.gender || '',
        description: product.description || '',
        brandId: product.brand_id?.toString() || '',
        categoryId: product.category_id?.toString() || '',
        price: product.price?.toString() || '',
        salePrice: product.sale_price?.toString() || '',
        saleStartDate: product.sale_start_date?.split('T')[0] || '',
        saleEndDate: product.sale_end_date?.split('T')[0] || '',
      });
      
      // 🚀 THE FIX 3: Alamin kung ang existing category ay parent o anak
      let currentParentId = null;
      if (product.category_id) {
        const cat = categories.find(c => c.id === product.category_id);
        if (cat) {
          // Kung may parent_id siya (hal. RING), yung parent niya ang ise-select sa unang dropdown
          // Kung wala (hal. BAGS), siya mismo yung parent
          currentParentId = cat.parent_id ? cat.parent_id : cat.id;
        }
      }
      setSelectedParentId(currentParentId);
    }
  }, [product, categories]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setError('');
    setIsSaving(true);

    try {
      const updatedData: Partial<Product> = {
        name: formData.name,
        ref_no: formData.ref_no,
        color: formData.color,
        gender: formData.gender,
        description: formData.description,
        brand_id: parseInt(formData.brandId),
        category_id: formData.categoryId ? parseInt(formData.categoryId) : null,
        price: parseFloat(formData.price),
        sale_price: formData.salePrice ? parseFloat(formData.salePrice) : null,
        sale_start_date: formData.saleStartDate || null,
        sale_end_date: formData.saleEndDate || null,
      };

      const success = await onSave(updatedData);
      if (success) {
        setIsEditing(false);
      }
    } catch (err) {
      setError('Failed to save product. Please try again.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !product) return null;

  const discountPercent = formData.salePrice && formData.price
    ? Math.round(((parseFloat(formData.price) - parseFloat(formData.salePrice)) / parseFloat(formData.price)) * 100)
    : 0;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-8 overflow-hidden">
        {/* Header with Product Info */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-5 flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Package size={18} className="text-slate-400" />
              <span className="text-xs font-medium text-slate-400">Product ID: {product.id}</span>
              {formData.salePrice && (
                <span className="ml-2 px-2.5 py-1 bg-red-500/20 text-red-300 text-xs font-bold rounded-full">
                  {discountPercent}% OFF
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white truncate">{formData.name || 'New Product'}</h2>
            <p className="text-slate-400 text-xs mt-1">SKU: {formData.ref_no || 'N/A'}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-8 mt-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg flex items-center gap-3">
            <AlertCircle size={20} className="flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-8 space-y-6 max-h-[calc(90vh-240px)] overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Images */}
            <div className="lg:col-span-1">
              <div className="sticky top-0 space-y-4">
                {/* Main Image */}
                <div className="relative w-full aspect-square bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl overflow-hidden border-2 border-slate-200 shadow-sm">
                  <Image
                    src={
                      product.image_1
                        ? `${process.env.NEXT_PUBLIC_R2_DOMAIN}/${product.image_1}`
                        : '/placeholder-image.webp'
                    }
                    alt={product.name}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Thumbnail Gallery */}
                {(product.image_2 || product.image_3) && (
                  <div className="grid grid-cols-2 gap-3">
                    {product.image_2 && (
                      <div className="relative aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200 hover:border-slate-400 transition-colors">
                        <Image
                          src={`${process.env.NEXT_PUBLIC_R2_DOMAIN}/${product.image_2}`}
                          alt={`${product.name} - 2`}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    {product.image_3 && (
                      <div className="relative aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200 hover:border-slate-400 transition-colors">
                        <Image
                          src={`${process.env.NEXT_PUBLIC_R2_DOMAIN}/${product.image_3}`}
                          alt={`${product.name} - 3`}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Pricing Summary Card */}
              <div className="bg-gradient-to-br from-blue-50 to-slate-50 border border-blue-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign size={16} className="text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Pricing</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-600 font-semibold uppercase tracking-wide mb-1.5">Regular Price</p>
                    <p className="text-xl font-bold text-slate-900">AED {formData.price || '0.00'}</p>
                  </div>
                  {formData.salePrice && (
                    <div>
                      <p className="text-xs text-slate-600 font-semibold uppercase tracking-wide mb-1.5">Sale Price</p>
                      <p className="text-xl font-bold text-green-600">AED {formData.salePrice}</p>
                      <p className="text-xs text-red-600 font-medium mt-0.5">Save {discountPercent}%</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Basic Info Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Product Name */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2.5">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-medium disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Reference / SKU */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2.5">
                      Reference / SKU
                    </label>
                    <input
                      type="text"
                      name="ref_no"
                      value={formData.ref_no}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-mono disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Brand */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2.5">
                      Brand
                    </label>
                    <select
                      name="brandId"
                      value={formData.brandId}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-right bg-no-repeat"
                      style={{
                        backgroundImage: !isEditing ? 'none' : 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22 viewBox=%220 0 12 8%22%3E%3Cpath fill=%22%23444%22 d=%22M0 0l6 8 6-8z%22/%3E%3C/svg%3E")',
                        paddingRight: isEditing ? '36px' : undefined
                      }}
                    >
                      <option value="">Select Brand</option>
                      {brands.map(brand => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 🚀 THE FIX 4: PARENT CATEGORY DROPDOWN */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2.5">
                      Main Category
                    </label>
                    <select
                      value={selectedParentId || ''}
                      onChange={(e) => {
                        const pId = e.target.value ? parseInt(e.target.value) : null;
                        setSelectedParentId(pId);
                        // Isang default save para kung walang subcategory, yung parent ang mase-save
                        setFormData(prev => ({ ...prev, categoryId: pId ? pId.toString() : '' }));
                      }}
                      disabled={!isEditing}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-right bg-no-repeat"
                      style={{
                        backgroundImage: !isEditing ? 'none' : 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22 viewBox=%220 0 12 8%22%3E%3Cpath fill=%22%23444%22 d=%22M0 0l6 8 6-8z%22/%3E%3C/svg%3E")',
                        paddingRight: isEditing ? '36px' : undefined
                      }}
                    >
                      <option value="">Select Category</option>
                      {parentCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 🚀 THE FIX 5: SUB-CATEGORY DROPDOWN (Lalabas lang kung may anak ang piniling Parent!) */}
                  {availableSubCategories.length > 0 && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                      <label className="block text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2.5">
                        Specific Type
                      </label>
                      <select
                        name="categoryId"
                        value={formData.categoryId}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-2.5 bg-indigo-50/50 border border-indigo-200 rounded-lg text-sm font-medium text-indigo-900 disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none bg-right bg-no-repeat"
                        style={{
                          backgroundImage: !isEditing ? 'none' : 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22 viewBox=%220 0 12 8%22%3E%3Cpath fill=%22%23444%22 d=%22M0 0l6 8 6-8z%22/%3E%3C/svg%3E")',
                          paddingRight: isEditing ? '36px' : undefined
                        }}
                      >
                        <option value={selectedParentId?.toString()}>-- Select Specific Subcategory --</option>
                        {availableSubCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Attributes Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Attributes</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Color */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2.5 flex items-center gap-2">
                      <Palette size={14} />
                      Color
                    </label>
                    <input
                      type="text"
                      name="color"
                      value={formData.color}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2.5 flex items-center gap-2">
                      <Users size={14} />
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-right bg-no-repeat"
                      style={{
                        backgroundImage: !isEditing ? 'none' : 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22 viewBox=%220 0 12 8%22%3E%3Cpath fill=%22%23444%22 d=%22M0 0l6 8 6-8z%22/%3E%3C/svg%3E")',
                        paddingRight: isEditing ? '36px' : undefined
                      }}
                    >
                      <option value="">Select Gender</option>
                      <option value="Unisex">Unisex</option>
                      <option value="Men">Men</option>
                      <option value="Women">Women</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Pricing Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Tag size={16} />
                  Pricing & Sales
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Regular Price */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2.5">
                      Regular Price (AED)
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      step="0.01"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Sale Price */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2.5">
                      Sale Price (AED)
                    </label>
                    <input
                      type="number"
                      name="salePrice"
                      value={formData.salePrice}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      step="0.01"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Sale Start Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2.5">
                      Sale Start Date
                    </label>
                    <input
                      type="date"
                      name="saleStartDate"
                      value={formData.saleStartDate}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Sale End Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2.5">
                      Sale End Date
                    </label>
                    <input
                      type="date"
                      name="saleEndDate"
                      value={formData.saleEndDate}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2.5">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-8 py-4 flex items-center justify-end gap-3">
          {!isEditing ? (
            <>
              <button
                onClick={onClose}
                className="px-6 py-2.5 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-all duration-200 border border-slate-300"
              >
                Close
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Edit2 size={18} />
                Edit Product
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-6 py-2.5 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-all duration-200 border border-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:from-green-500 disabled:to-green-600"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}