import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getSellerProduct,
  createProduct,
  updateProduct,
  createVariant,
  updateVariant,
  deleteVariant,
  createProductImage,
  deleteProductImage
} from '../../services/sellerService.js';
import { getCategories } from '../../services/categoryService.js';
import { useToast } from '../../components/common/Toast.jsx';
import SellerNavHeader from './SellerNavHeader.jsx';

export const SellerProductFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const isEditMode = Boolean(id);

  // Categories & Form data
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    price: '',
    discount: '0',
    stock: '0',
    status: 'ACTIVE',
    sku: ''
  });

  // Associated resources (only relevant in Edit Mode)
  const [variants, setVariants] = useState([]);
  const [images, setImages] = useState([]);

  // Variant Modal State
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [variantForm, setVariantForm] = useState({
    name: '',
    sku: '',
    price: '',
    stock: '0',
    isActive: true
  });
  const [variantSubmitting, setVariantSubmitting] = useState(false);

  // Image Modal State
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageForm, setImageForm] = useState({
    url: '',
    altText: '',
    displayOrder: 0
  });
  const [imageSubmitting, setImageSubmitting] = useState(false);

  // Load Categories & Product (if Edit mode)
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        setLoadError(null);

        const cats = await getCategories();
        setCategories(cats);

        if (isEditMode) {
          const product = await getSellerProduct(id);
          if (!product) {
            throw new Error('Product not found or access denied');
          }

          setFormData({
            name: product.name || '',
            description: product.description || '',
            categoryId: product.categoryId || '',
            price: product.price?.toString() || '',
            discount: (product.discount ?? 0).toString(),
            stock: (product.stock ?? 0).toString(),
            status: product.status || 'ACTIVE',
            sku: product.sku || ''
          });

          setVariants(product.variants || []);
          setImages(product.images || []);
        } else if (cats.length > 0) {
          setFormData((prev) => ({ ...prev, categoryId: cats[0].id }));
        }
      } catch (err) {
        console.error('Failed to load product form data:', err);
        const msg =
          err.response?.status === 403
            ? 'Unauthorized: You do not have permission to view or edit this product.'
            : err.response?.data?.message || err.message || 'Failed to load product details.';
        setLoadError(msg);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [id, isEditMode]);

  // Form Change Handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Main Product Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast('Product name is required', 'error');
      return;
    }
    if (!formData.categoryId) {
      addToast('Please select a category', 'error');
      return;
    }
    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      addToast('Price must be greater than zero', 'error');
      return;
    }

    const discountNum = parseFloat(formData.discount || 0);
    if (discountNum > priceNum) {
      addToast('Discount cannot be greater than price', 'error');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      categoryId: formData.categoryId,
      price: priceNum,
      discount: discountNum,
      stock: parseInt(formData.stock || 0, 10),
      status: formData.status
    };

    if (formData.sku.trim()) {
      payload.sku = formData.sku.trim();
    }

    try {
      setSubmitting(true);
      if (isEditMode) {
        await updateProduct(id, payload);
        addToast('Product updated successfully', 'success');
      } else {
        const created = await createProduct(payload);
        addToast('Product created successfully', 'success');
        navigate(`/seller/products/${created.id}/edit`);
        return;
      }
    } catch (err) {
      console.error('Failed to save product:', err);
      addToast(err.response?.data?.message || 'Failed to save product.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Variant Actions
  const handleOpenAddVariant = () => {
    setEditingVariant(null);
    setVariantForm({
      name: '',
      sku: '',
      price: '',
      stock: '0',
      isActive: true
    });
    setIsVariantModalOpen(true);
  };

  const handleOpenEditVariant = (v) => {
    setEditingVariant(v);
    setVariantForm({
      name: v.name || '',
      sku: v.sku || '',
      price: v.price ? v.price.toString() : '',
      stock: (v.stock ?? 0).toString(),
      isActive: v.isActive ?? true
    });
    setIsVariantModalOpen(true);
  };

  const handleSaveVariant = async (e) => {
    e.preventDefault();
    if (!variantForm.name.trim()) {
      addToast('Variant name is required', 'error');
      return;
    }

    const payload = {
      name: variantForm.name.trim(),
      stock: parseInt(variantForm.stock || 0, 10),
      isActive: variantForm.isActive
    };

    if (variantForm.sku.trim()) {
      payload.sku = variantForm.sku.trim();
    }

    if (variantForm.price && !isNaN(parseFloat(variantForm.price))) {
      payload.price = parseFloat(variantForm.price);
    }

    try {
      setVariantSubmitting(true);
      if (editingVariant) {
        const updated = await updateVariant(id, editingVariant.id, payload);
        setVariants((prev) => prev.map((v) => (v.id === editingVariant.id ? updated : v)));
        addToast(`Variant "${payload.name}" updated`, 'success');
      } else {
        const created = await createVariant(id, payload);
        setVariants((prev) => [...prev, created]);
        addToast(`Variant "${payload.name}" created`, 'success');
      }
      setIsVariantModalOpen(false);
    } catch (err) {
      console.error('Failed to save variant:', err);
      addToast(err.response?.data?.message || 'Failed to save variant.', 'error');
    } finally {
      setVariantSubmitting(false);
    }
  };

  const handleDeleteVariant = async (variantId, variantName) => {
    if (!window.confirm(`Are you sure you want to delete variant "${variantName}"?`)) return;
    try {
      await deleteVariant(id, variantId);
      setVariants((prev) => prev.filter((v) => v.id !== variantId));
      addToast(`Variant "${variantName}" deleted`, 'success');
    } catch (err) {
      console.error('Failed to delete variant:', err);
      addToast(err.response?.data?.message || 'Failed to delete variant.', 'error');
    }
  };

  // Image Actions
  const handleSaveImage = async (e) => {
    e.preventDefault();
    if (!imageForm.url.trim()) {
      addToast('Image URL is required', 'error');
      return;
    }

    const payload = {
      url: imageForm.url.trim(),
      altText: imageForm.altText.trim() || null,
      displayOrder: parseInt(imageForm.displayOrder || 0, 10)
    };

    try {
      setImageSubmitting(true);
      const created = await createProductImage(id, payload);
      setImages((prev) => [...prev, created]);
      addToast('Image added to product', 'success');
      setIsImageModalOpen(false);
      setImageForm({ url: '', altText: '', displayOrder: 0 });
    } catch (err) {
      console.error('Failed to add product image:', err);
      addToast(err.response?.data?.message || 'Failed to add image.', 'error');
    } finally {
      setImageSubmitting(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Are you sure you want to remove this image?')) return;
    try {
      await deleteProductImage(id, imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      addToast('Image removed', 'success');
    } catch (err) {
      console.error('Failed to remove image:', err);
      addToast(err.response?.data?.message || 'Failed to remove image.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mx-auto mb-3"></div>
        <p className="text-xs font-medium text-neutral-500">Loading product editor...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <SellerNavHeader />
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-8 text-center">
          <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-rose-900 mb-1">Access Rejected</h2>
          <p className="text-xs text-rose-700 mb-4">{loadError}</p>
          <Link
            to="/seller/products"
            className="inline-flex items-center px-4 py-2 bg-neutral-900 text-white text-xs font-medium rounded-lg hover:bg-neutral-800 transition-colors"
          >
            ← Return to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <SellerNavHeader />

      {/* Breadcrumb / Title Bar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1">
            <Link to="/seller/products" className="hover:text-neutral-900 underline">
              Products
            </Link>
            <span>/</span>
            <span className="text-neutral-900 font-medium">
              {isEditMode ? 'Edit Product' : 'Create New Product'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {isEditMode ? `Edit: ${formData.name || 'Product'}` : 'New Product Registration'}
          </h1>
        </div>

        <Link
          to="/seller/products"
          className="text-xs font-medium text-neutral-600 hover:text-neutral-900 px-3 py-1.5 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
        >
          Cancel
        </Link>
      </div>

      {/* Main Product Details Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-neutral-900 uppercase font-mono tracking-wider mb-4 border-b border-neutral-100 pb-2">
            General Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                maxLength={200}
                placeholder="e.g., Premium Leather Messenger Bag"
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                SKU (Stock Keeping Unit)
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="e.g., BAG-LTHR-001"
                className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
              />
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Alphanumeric characters, hyphens, and underscores only.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 bg-white"
              >
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Base Price ($) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                name="price"
                step="0.01"
                min="0.01"
                value={formData.price}
                onChange={handleChange}
                required
                placeholder="0.00"
                className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Discount Amount ($)
              </label>
              <input
                type="number"
                name="discount"
                step="0.01"
                min="0"
                value={formData.discount}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Stock Quantity (Base Product)
              </label>
              <input
                type="number"
                name="stock"
                min="0"
                step="1"
                value={formData.stock}
                onChange={handleChange}
                disabled={variants.length > 0}
                className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 disabled:bg-neutral-100 disabled:text-neutral-400"
              />
              {variants.length > 0 && (
                <p className="text-[11px] text-amber-600 mt-0.5">
                  Stock is tracked at the variant level when variants are defined.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Status <span className="text-rose-500">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 bg-white"
              >
                <option value="ACTIVE">ACTIVE (Visible in Storefront)</option>
                <option value="INACTIVE">INACTIVE (Hidden / Draft)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                rows={4}
                maxLength={2000}
                value={formData.description}
                onChange={handleChange}
                placeholder="Provide a detailed, compelling description of your product..."
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
              />
              <p className="text-[11px] text-neutral-400 text-right mt-0.5">
                {formData.description.length}/2000 characters
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-neutral-100">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {submitting
                ? 'Saving Product...'
                : isEditMode
                ? 'Save Product Changes'
                : 'Create Product'}
            </button>
          </div>
        </div>
      </form>

      {/* Sub-resource Management (Only for existing products) */}
      {isEditMode && (
        <div className="mt-8 space-y-8">
          {/* Variants Section */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 uppercase font-mono tracking-wider">
                  Product Variants
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Manage sizes, colors, or versions with independent SKUs and inventory levels.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddVariant}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Variant
              </button>
            </div>

            {variants.length === 0 ? (
              <div className="text-center py-6 text-neutral-400 text-xs border border-dashed border-neutral-200 rounded-lg">
                No variants configured yet. This product sells as a standard single-SKU item.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200 text-[11px] font-mono uppercase text-neutral-500">
                      <th className="py-2.5 px-3">Variant Name</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Price</th>
                      <th className="py-2.5 px-3">Stock</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {variants.map((v) => (
                      <tr key={v.id} className="hover:bg-neutral-50/50">
                        <td className="py-2.5 px-3 font-semibold text-neutral-900">{v.name}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-neutral-600">
                          {v.sku || '—'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-neutral-800">
                          {v.price ? `$${Number(v.price).toFixed(2)}` : 'Uses Base Price'}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          <span
                            className={
                              v.stock <= 0
                                ? 'text-rose-600 font-medium'
                                : v.stock <= 5
                                ? 'text-amber-600 font-medium'
                                : 'text-neutral-800'
                            }
                          >
                            {v.stock} units
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono font-medium border ${
                              v.isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                            }`}
                          >
                            {v.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditVariant(v)}
                              className="text-[11px] text-neutral-700 hover:text-neutral-900 underline"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteVariant(v.id, v.name)}
                              className="text-[11px] text-rose-600 hover:text-rose-800 underline"
                            >
                              Delete
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

          {/* Images Section */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 uppercase font-mono tracking-wider">
                  Product Gallery Images
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Add image URLs and alt text to showcase your product in the customer catalogue.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsImageModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Image
              </button>
            </div>

            {images.length === 0 ? (
              <div className="text-center py-6 text-neutral-400 text-xs border border-dashed border-neutral-200 rounded-lg">
                No images added yet. Add image URLs to attract buyers.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className="relative group border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50 aspect-square flex flex-col justify-between"
                  >
                    <img
                      src={img.url}
                      alt={img.altText || 'Product image'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/150?text=No+Preview';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 text-white text-[10px]">
                      <span className="font-mono">Order: {img.displayOrder}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(img.id)}
                        className="self-end px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-semibold transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Variant Modal */}
      {isVariantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900 mb-3">
              {editingVariant ? 'Edit Variant' : 'Add Product Variant'}
            </h3>
            <form onSubmit={handleSaveVariant} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Variant Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Size Large - Black"
                  value={variantForm.name}
                  onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-lg focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Variant SKU
                </label>
                <input
                  type="text"
                  placeholder="e.g., BAG-LTHR-BLK-L"
                  value={variantForm.sku}
                  onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs font-mono border border-neutral-300 rounded-lg focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Variant Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Optional override"
                    value={variantForm.price}
                    onChange={(e) => setVariantForm({ ...variantForm, price: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-mono border border-neutral-300 rounded-lg focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={variantForm.stock}
                    onChange={(e) => setVariantForm({ ...variantForm, stock: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-mono border border-neutral-300 rounded-lg focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="variantActiveCheck"
                  checked={variantForm.isActive}
                  onChange={(e) => setVariantForm({ ...variantForm, isActive: e.target.checked })}
                  className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                />
                <label htmlFor="variantActiveCheck" className="text-xs text-neutral-700 font-medium">
                  Active (available for purchase)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsVariantModalOpen(false)}
                  disabled={variantSubmitting}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={variantSubmitting}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white"
                >
                  {variantSubmitting ? 'Saving...' : 'Save Variant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {isImageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900 mb-3">Add Product Image</h3>
            <form onSubmit={handleSaveImage} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Image URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/product-image.jpg"
                  value={imageForm.url}
                  onChange={(e) => setImageForm({ ...imageForm, url: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-lg focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Alt Text
                </label>
                <input
                  type="text"
                  placeholder="e.g., Front view of leather bag"
                  value={imageForm.altText}
                  onChange={(e) => setImageForm({ ...imageForm, altText: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-lg focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={imageForm.displayOrder}
                  onChange={(e) => setImageForm({ ...imageForm, displayOrder: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs font-mono border border-neutral-300 rounded-lg focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(false)}
                  disabled={imageSubmitting}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={imageSubmitting}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white"
                >
                  {imageSubmitting ? 'Adding...' : 'Add Image'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerProductFormPage;
