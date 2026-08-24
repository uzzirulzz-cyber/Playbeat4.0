import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, ProductType, ProductVariation } from '../../types';
import {
  X,
  Plus,
  Trash2,
  Save,
  Projector,
  Zap,
  Truck,
  Layers,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Eye,
  Upload,
  Image as ImageIcon,
  Video,
  Link as LinkIcon,
  ShoppingCart,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProductEditorModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductEditorModal: React.FC<ProductEditorModalProps> = ({ product, isOpen, onClose }) => {
  const { categories, products, addProduct, updateProduct, addToast } = useStore();

  const isEditing = Boolean(product);

  const [title, setTitle] = useState(product?.title || '');
  const [sku, setSku] = useState(product?.sku || `PB-${Math.floor(1000 + Math.random() * 9000)}`);
  const [categoryId, setCategoryId] = useState(product?.categoryId || 'gaming');
  const [productType, setProductType] = useState<ProductType>(product?.productType || 'digital');
  const [price, setPrice] = useState(product?.price || 29.99);
  const [compareAtPrice, setCompareAtPrice] = useState(product?.compareAtPrice || 39.99);
  const [stock, setStock] = useState(product?.stock || 50);
  const [shortDescription, setShortDescription] = useState(product?.shortDescription || '');
  const [description, setDescription] = useState(product?.description || '');

  // Media: multiple images (upload or URL) + optional video URL
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [videoUrl, setVideoUrl] = useState(product?.videoUrl || '');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload — converts to base64 data URL for local preview
  // In production this would upload to S3/OSS and store the returned URL.
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      // Check file type
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        addToast('error', 'Invalid File', `${file.name} is not an image or video.`);
        return;
      }
      // Check file size (max 10MB for images, 50MB for videos)
      const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        addToast('error', 'File Too Large', `${file.name} exceeds the size limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        if (file.type.startsWith('video/')) {
          setVideoUrl(dataUrl);
          addToast('success', 'Video Added', `${file.name} uploaded.`);
        } else {
          setImages((prev) => [...prev, dataUrl]);
          addToast('success', 'Image Added', `${file.name} uploaded.`);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input so the same file can be selected again
    e.target.value = '';
  }, [addToast]);

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    // Basic URL validation
    try {
      new URL(imageUrlInput);
    } catch {
      addToast('error', 'Invalid URL', 'Please enter a valid image URL.');
      return;
    }
    setImages((prev) => [...prev, imageUrlInput.trim()]);
    setImageUrlInput('');
    addToast('success', 'Image Added', 'Image URL added to gallery.');
  };

  const handleRemoveImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleRemoveVideo = () => {
    setVideoUrl('');
  };

  // Variations list
  const [variations, setVariations] = useState<ProductVariation[]>(product?.variations || [
    { id: 'v1', type: 'Edition', value: 'Standard Global', price: price, stock: 50 }
  ]);

  // Projector specs
  const [nativeResolution, setNativeResolution] = useState(product?.projectorSpecs?.nativeResolution || '4K UHD (3840x2160)');
  const [brightness, setBrightness] = useState(product?.projectorSpecs?.brightness || '2800 ANSI Lumens');
  const [throwRatio, setThrowRatio] = useState(product?.projectorSpecs?.throwRatio || '0.23:1 UST');
  const [operatingSystem, setOperatingSystem] = useState(product?.projectorSpecs?.operatingSystem || 'Google TV 11.0');
  const [ram, setRam] = useState(product?.projectorSpecs?.ram || '4GB');
  const [storage, setStorage] = useState(product?.projectorSpecs?.storage || '64GB');
  const [speakerSpecs, setSpeakerSpecs] = useState(product?.projectorSpecs?.speakerSpecs || '30W Harman Kardon Dolby Atmos');

  // ---- New: visibility / promotional flags / badge controls ----
  const [status, setStatus] = useState<Product['status']>(product?.status || 'published');
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  const [isTrending, setIsTrending] = useState(product?.isTrending ?? false);
  const [isTrendingWeek, setIsTrendingWeek] = useState(product?.isTrendingWeek ?? false);
  const [isBestSeller, setIsBestSeller] = useState(product?.isBestSeller ?? false);
  const [isFlashDeal, setIsFlashDeal] = useState(product?.isFlashDeal ?? false);
  const [isLimitedTime, setIsLimitedTime] = useState(product?.isLimitedTime ?? false);
  const [offerBadgeText, setOfferBadgeText] = useState(product?.offerBadgeText || '');
  const [offerBadgeColor, setOfferBadgeColor] = useState<Product['offerBadgeColor']>(product?.offerBadgeColor || 'red');
  const [tags, setTags] = useState<string[]>(product?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [showLivePreview, setShowLivePreview] = useState(false);

  // Keep the drawer form synchronized when the selected row changes. Without
  // this, React preserves the previous product's draft while editing another.
  useEffect(() => {
    if (!isOpen) return;
    setTitle(product?.title || '');
    setSku(product?.sku || `PB-${Math.floor(1000 + Math.random() * 9000)}`);
    setCategoryId(product?.categoryId || 'gaming');
    setProductType(product?.productType || 'digital');
    setPrice(product?.price || 29.99);
    setCompareAtPrice(product?.compareAtPrice || 39.99);
    setStock(product?.stock || 50);
    setShortDescription(product?.shortDescription || '');
    setDescription(product?.description || '');
    setImages(product?.images || []);
    setVideoUrl(product?.videoUrl || '');
    setImageUrlInput('');
    setVariations(product?.variations || [{ id: `v-${Date.now()}`, type: 'Edition', value: 'Standard Global', price: product?.price || 29.99, stock: product?.stock || 50 }]);
    setStatus(product?.status || 'published');
    setIsFeatured(product?.isFeatured ?? false);
    setIsTrending(product?.isTrending ?? false);
    setIsTrendingWeek(product?.isTrendingWeek ?? false);
    setIsBestSeller(product?.isBestSeller ?? false);
    setIsFlashDeal(product?.isFlashDeal ?? false);
    setIsLimitedTime(product?.isLimitedTime ?? false);
    setOfferBadgeText(product?.offerBadgeText || '');
    setOfferBadgeColor(product?.offerBadgeColor || 'red');
    setTags(product?.tags || []);
    setTagInput('');
    setShowLivePreview(false);
  }, [isOpen, product]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (!t) return;
    if (tags.includes(t)) {
      setTagInput('');
      return;
    }
    setTags([...tags, t]);
    setTagInput('');
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((x) => x !== t));
  };

  // Build a "preview product" object that mirrors what the storefront will render
  const previewProduct: Product = {
    id: product?.id || 'preview',
    title: title || 'Product Title',
    slug: (title || 'product-title').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    shortDescription: shortDescription || 'Short description preview…',
    description: description || '',
    categoryId,
    categoryName: categories.find((c) => c.id === categoryId)?.name || 'Digital',
    productType,
    price: Number(price) || 0,
    compareAtPrice: Number(compareAtPrice) || 0,
    costPrice: undefined,
    discountPercent: compareAtPrice > price ? Math.round(((Number(compareAtPrice) - Number(price)) / Number(compareAtPrice)) * 100) : 0,
    images: images.length > 0 ? images : ['https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/1a2604e96f45.jpg'],
    videoUrl: videoUrl || undefined,
    variations,
    tags,
    isFeatured,
    isTrending,
    isTrendingWeek,
    isBestSeller,
    isFlashDeal,
    isLimitedTime,
    offerBadgeText: offerBadgeText || undefined,
    offerBadgeColor,
    status,
    rating: product?.rating || 4.9,
    reviewCount: product?.reviewCount || 18,
    reviews: product?.reviews || [],
    stock: Number(stock) || 0,
    lowStockThreshold: 5,
    sku,
    createdAt: product?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const handleAddVariation = () => {
    const newV: ProductVariation = {
      id: `v-${Date.now()}`,
      type: variations.length > 0 ? variations[0].type : 'Tier',
      value: `Option ${variations.length + 1}`,
      price: price,
      stock: 50
    };
    setVariations([...variations, newV]);
  };

  const handleRemoveVariation = (idx: number) => {
    setVariations(variations.filter((_, i) => i !== idx));
  };

  const handleVariationChange = (idx: number, field: keyof ProductVariation, val: any) => {
    const updated = [...variations];
    updated[idx] = { ...updated[idx], [field]: val };
    setVariations(updated);
  };

  // Duplicate variant detection — flag variants that share the same (type, value)
  // pair so admins can resolve them before publishing.
  const duplicateVariantKeys = new Set<string>();
  const seenVariantKeys = new Set<string>();
  variations.forEach((v) => {
    const key = `${v.type?.trim().toLowerCase()}|${v.value?.trim().toLowerCase()}`;
    if (!key || key === '|') return;
    if (seenVariantKeys.has(key)) {
      duplicateVariantKeys.add(key);
    } else {
      seenVariantKeys.add(key);
    }
  });

  const hasDuplicateVariants = duplicateVariantKeys.size > 0;

  const variantSkus = variations.map((variation) => variation.sku?.trim().toLowerCase()).filter(Boolean) as string[];
  const hasDuplicateVariantSkus = new Set(variantSkus).size !== variantSkus.length;

  // Duplicate SKU detection across catalog (excluding the product being edited).
  const existingSkus = products
    .filter((p) => p.id !== product?.id)
    .map((p) => p.sku.toLowerCase());
  const isDuplicateSku = sku && existingSkus.includes(sku.toLowerCase());

  // Duplicate title detection across catalog (excluding the product being edited).
  const existingTitles = products
    .filter((p) => p.id !== product?.id)
    .map((p) => p.title.trim().toLowerCase());
  const isDuplicateTitle = title && existingTitles.includes(title.trim().toLowerCase());

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !sku) {
      addToast('error', 'Validation Error', 'Title and SKU are required.');
      return;
    }
    if (isDuplicateSku) {
      addToast('error', 'Duplicate SKU', `Another product already uses SKU "${sku}". Please choose a unique SKU.`);
      return;
    }
    if (isDuplicateTitle) {
      addToast('error', 'Duplicate Title', `Another product already uses the title "${title}". Please choose a unique title.`);
      return;
    }
    if (hasDuplicateVariants) {
      addToast('error', 'Duplicate Variants', 'Two or more variations share the same type and value. Please make each variation unique before saving.');
      return;
    }
    if (hasDuplicateVariantSkus) {
      addToast('error', 'Duplicate Variant SKU', 'Each variant SKU must be unique before publishing.');
      return;
    }

    const catObj = categories.find(c => c.id === categoryId);

    const newProductData: Product = {
      id: product?.id || `prod-${Date.now()}`,
      title,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      sku,
      categoryId,
      categoryName: catObj ? catObj.name : 'Digital',
      productType,
      price: Number(price),
      compareAtPrice: Number(compareAtPrice),
      discountPercent: compareAtPrice > price ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : 0,
      shortDescription,
      description,
      images: images.length > 0 ? images : ['https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/1a2604e96f45.jpg'],
      videoUrl: videoUrl || undefined,
      status,
      stock: Number(stock),
      lowStockThreshold: 5,
      rating: product?.rating || 4.9,
      reviewCount: product?.reviewCount || 18,
      isFeatured,
      isTrending,
      isTrendingWeek,
      isBestSeller,
      isFlashDeal,
      isLimitedTime,
      offerBadgeText: offerBadgeText || undefined,
      offerBadgeColor: offerBadgeText ? offerBadgeColor : undefined,
      tags,
      variations: variations,
      projectorSpecs: productType === 'physical_projector' ? {
        model: sku,
        nativeResolution,
        brightness,
        throwRatio,
        screenSize: '150 Inches',
        operatingSystem,
        ram,
        storage,
        speakerSpecs,
        keystoneCorrection: 'Omnidirectional ToF Laser',
        connectivity: ['HDMI 2.1 eARC', 'Wi-Fi 6', 'Bluetooth 5.2'],
        warranty: '3-Year Official Warranty',
        shippingInfo: 'Free DHL Tracked Express (2-4 Days)'
      } : undefined,
      createdAt: product?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (isEditing) {
      updateProduct(newProductData);
      addToast('success', 'Product Updated', `${title} updated successfully.`);
    } else {
      addProduct(newProductData);
      addToast('success', 'Product Created', `${title} added to catalog.`);
    }

    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-4xl rounded-3xl bg-[#0F111A] border border-white/15 shadow-2xl p-6 sm:p-8 z-10 my-6 max-h-[92vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center">
                {productType === 'physical_projector' ? <Projector className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white font-display">
                  {isEditing ? 'Edit Product & Variations' : 'Create New Product'}
                </h2>
                <p className="text-xs text-neutral-400">
                  {productType === 'physical_projector' ? 'Physical Smart Projector Hardware Specification' : 'Digital License Key & Subscription Item'}
                </p>
              </div>
            </div>

            <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="mt-6 space-y-6 text-xs">
            {/* 1. Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-neutral-300 font-medium mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. CineBeam 4K UST Laser Projector"
                  className={`w-full bg-[#141622] rounded-xl border px-3.5 py-2.5 text-xs text-white focus:outline-none ${
                    isDuplicateTitle ? 'border-red-500/60 focus:border-red-500' : 'border-white/10 focus:border-red-500/50'
                  }`}
                />
                {isDuplicateTitle && (
                  <p className="mt-1 text-[10px] text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    A product with this title already exists. Use a unique title.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">SKU</label>
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className={`w-full bg-[#141622] rounded-xl border px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none ${
                    isDuplicateSku ? 'border-red-500/60 focus:border-red-500' : 'border-white/10 focus:border-red-500/50'
                  }`}
                />
                {isDuplicateSku && (
                  <p className="mt-1 text-[10px] text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    SKU already in use by another product.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Product Type</label>
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value as ProductType)}
                  className="w-full bg-[#141622] rounded-xl border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500/50 font-medium"
                >
                  <option value="digital">Instant Digital Key</option>
                  <option value="physical_projector">Physical Smart Projector</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-[#141622] rounded-xl border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500/50"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Stock Level</label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                  className="w-full bg-[#141622] rounded-xl border border-white/10 px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            {/* 2. Pricing */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-neutral-300 font-medium mb-1">Store Price (PKR / Rs)</label>
                <input
                  type="number"
                  step="1"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full bg-[#141622] rounded-xl border border-white/10 px-3 py-2 text-xs text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Compare At / MSRP (Rs)</label>
                <input
                  type="number"
                  step="1"
                  value={compareAtPrice}
                  onChange={(e) => setCompareAtPrice(Number(e.target.value))}
                  className="w-full bg-[#141622] rounded-xl border border-white/10 px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              {/* Media upload — images + video */}
              <div className="col-span-2 sm:col-span-2">
                <label className="block text-neutral-300 font-medium mb-2 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Product Images & Video</span>
                </label>

                {/* Upload drop zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/15 rounded-xl p-4 text-center cursor-pointer hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all"
                >
                  <Upload className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                  <div className="text-xs text-gray-400">Click to upload images or video</div>
                  <div className="text-[10px] text-gray-600 mt-1">PNG, JPG, WebP (max 10MB) · MP4, WebM (max 50MB)</div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {/* URL input for external images */}
                <div className="flex gap-2 mt-2">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
                    <input
                      type="text"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddImageUrl(); } }}
                      placeholder="Paste image URL..."
                      className="w-full bg-[#141622] rounded-xl border border-white/10 pl-8 pr-3 py-1.5 text-xs text-white font-mono placeholder-gray-600 focus:outline-none focus:border-emerald-500/40"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add URL
                  </button>
                </div>

                {/* Image gallery */}
                {images.length > 0 && (
                  <div className="mt-3">
                    <div className="text-[10px] uppercase text-gray-500 tracking-wider font-mono mb-2">
                      Images ({images.length})
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-white/10 bg-black">
                          <img src={img} alt={`Product image ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-1 right-1 p-1 rounded-md bg-black/70 text-red-400 hover:bg-red-500/80 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Remove image"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          {idx === 0 && (
                            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-emerald-500/90 text-black text-[8px] font-bold uppercase">
                              Primary
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Video preview */}
                {videoUrl && (
                  <div className="mt-3">
                    <div className="text-[10px] uppercase text-gray-500 tracking-wider font-mono mb-2 flex items-center gap-1">
                      <Video className="w-3 h-3 text-purple-400" /> Product Video
                    </div>
                    <div className="relative rounded-lg overflow-hidden border border-white/10 bg-black">
                      {videoUrl.startsWith('data:video') || videoUrl.startsWith('blob:') ? (
                        <video src={videoUrl} controls className="w-full max-h-48 object-contain" />
                      ) : (
                        <iframe src={videoUrl} className="w-full h-48" title="Product video" allowFullScreen />
                      )}
                      <button
                        type="button"
                        onClick={handleRemoveVideo}
                        className="absolute top-2 right-2 p-1.5 rounded-md bg-black/70 text-red-400 hover:bg-red-500/80 hover:text-white"
                        aria-label="Remove video"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Descriptions */}
            <div className="space-y-3">
              <div>
                <label className="block text-neutral-300 font-medium mb-1">Short Description</label>
                <input
                  type="text"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className="w-full bg-[#141622] rounded-xl border border-white/10 px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Full Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#141622] rounded-xl border border-white/10 p-3 text-xs text-white resize-none"
                />
              </div>
            </div>

            {/* 3.5. Visibility, Promotional Flags & Badges */}
            <div className="p-4 rounded-2xl pb-panel space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white font-display flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--pb-red-bright)]" />
                  Visibility, Promotional Flags & Badges
                </span>
                <button
                  type="button"
                  onClick={() => setShowLivePreview((v) => !v)}
                  className="pb-btn pb-btn-secondary pb-btn-sm"
                  aria-pressed={showLivePreview}
                >
                  <Eye className="w-3 h-3" />
                  <span>{showLivePreview ? 'Hide' : 'Show'} Live Preview</span>
                </button>
              </div>

              {/* Status (visibility) */}
              <div>
                <label className="pb-label">Product Status / Visibility</label>
                <div className="flex flex-wrap gap-2">
                  {([
                    { value: 'published', label: 'Published (visible on storefront)', color: 'pb-status-published' },
                    { value: 'draft', label: 'Draft (hidden, in-progress)', color: 'pb-status-draft' },
                    { value: 'archived', label: 'Archived (hidden, retired)', color: 'pb-status-archived' },
                    { value: 'pending_approval', label: 'Pending Approval', color: 'pb-status-draft' },
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setStatus(opt.value)}
                      className={`pb-variant-chip ${status === opt.value ? 'is-selected' : ''}`}
                      aria-pressed={status === opt.value}
                    >
                      <span className={`pb-status ${opt.color} mr-1`}>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Promotional flags — toggle switches */}
              <div>
                <label className="pb-label">Promotional Flags</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Featured', state: isFeatured, setter: setIsFeatured, hint: 'Show in Featured sections' },
                    { label: 'Trending', state: isTrending, setter: setIsTrending, hint: 'Show in Trending sections' },
                    { label: 'Trending This Week', state: isTrendingWeek, setter: setIsTrendingWeek, hint: 'Highlight as weekly pick' },
                    { label: 'Best Seller', state: isBestSeller, setter: setIsBestSeller, hint: 'Show "BEST SELLER" badge' },
                    { label: 'Flash Deal', state: isFlashDeal, setter: setIsFlashDeal, hint: 'Show in Flash Deals + "Buy Now" CTA' },
                    { label: 'Limited Time', state: isLimitedTime, setter: setIsLimitedTime, hint: 'Show "LIMITED" badge' },
                  ].map((flag) => (
                    <label
                      key={flag.label}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[var(--pb-ink)] border border-[var(--pb-line)] cursor-pointer hover:border-[var(--pb-red-line)]"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white">{flag.label}</div>
                        <div className="text-[10px] text-[var(--pb-silver-3)] truncate">{flag.hint}</div>
                      </div>
                      <div className="pb-toggle">
                        <input
                          type="checkbox"
                          checked={flag.state}
                          onChange={(e) => flag.setter(e.target.checked)}
                          aria-label={flag.label}
                        />
                        <div className="pb-toggle-track">
                          <div className="pb-toggle-thumb" />
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Custom badge (overrides derived badge) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="pb-label">Custom Badge Text (optional)</label>
                  <input
                    type="text"
                    value={offerBadgeText}
                    onChange={(e) => setOfferBadgeText(e.target.value)}
                    placeholder="e.g. NEW, SALE, POPULAR, BEST SELLER, LIMITED"
                    maxLength={32}
                    className="pb-input"
                  />
                  <p className="text-[10px] text-[var(--pb-silver-4)] mt-1">
                    Overrides the auto-derived badge. Leave blank to derive from flags.
                  </p>
                </div>
                <div>
                  <label className="pb-label">Badge Color</label>
                  <div className="flex flex-wrap gap-2">
                    {([
                      { value: 'red', label: 'Red' },
                      { value: 'yellow', label: 'Yellow' },
                      { value: 'green', label: 'Green' },
                      { value: 'blue', label: 'Blue' },
                    ] as const).map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setOfferBadgeColor(c.value)}
                        className={`pb-variant-chip ${offerBadgeColor === c.value ? 'is-selected' : ''}`}
                        aria-pressed={offerBadgeColor === c.value}
                      >
                        <span className={`pb-badge pb-badge-${c.value} mr-1`}>{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="pb-label">Product Tags</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Type a tag and press Enter"
                    className="pb-input flex-1"
                  />
                  <button type="button" onClick={handleAddTag} className="pb-btn pb-btn-secondary pb-btn-sm">
                    <Plus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tags.length === 0 ? (
                    <span className="text-[11px] text-[var(--pb-silver-4)]">No tags yet.</span>
                  ) : (
                    tags.map((t) => (
                      <span
                        key={t}
                        className="pb-variant-chip is-selected flex items-center gap-1"
                      >
                        <span>{t}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(t)}
                          className="hover:text-white"
                          aria-label={`Remove tag ${t}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Live preview pane */}
              {showLivePreview && (
                <div className="p-4 rounded-xl bg-[var(--pb-ink)] border border-[var(--pb-line)]">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--pb-silver-3)] mb-3">
                    Storefront Live Preview
                  </div>
                  <div className="max-w-[280px] mx-auto">
                    <LivePreviewCard product={previewProduct} />
                  </div>
                </div>
              )}
            </div>

            {/* 4. Variations with Duplicate Protection */}
            <div className={`p-4 rounded-2xl bg-[#141622] border space-y-3 ${
              hasDuplicateVariants ? 'border-red-500/40 bg-red-500/[0.03]' : 'border-white/5'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white font-display flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-red-400" />
                  <span>Product Variations ({variations.length})</span>
                </span>
                <button
                  type="button"
                  onClick={handleAddVariation}
                  className="px-2.5 py-1 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30 text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Option
                </button>
              </div>

              {hasDuplicateVariants && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-[11px] text-red-300">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    Duplicate variations detected — two or more variations share the same Type + Value pair.
                    Each variation must be unique to avoid cart and checkout ambiguity.
                  </span>
                </div>
              )}

              {/* Column labels */}
              {variations.length > 0 && (
                <div className="grid grid-cols-[7rem_1fr_6rem_5rem_5rem_2rem] gap-2 px-1 text-[10px] font-mono uppercase text-neutral-500 tracking-wider">
                  <span>Type</span>
                  <span>Value</span>
                  <span>Variant SKU</span>
                  <span>Price</span>
                  <span>Stock</span>
                  <span></span>
                </div>
              )}

              <div className="space-y-2">
                {variations.map((v, idx) => {
                  const variantKey = `${v.type?.trim().toLowerCase()}|${v.value?.trim().toLowerCase()}`;
                  const isDup = duplicateVariantKeys.has(variantKey);
                  return (
                    <div
                      key={idx}
                      className={`grid grid-cols-[7rem_1fr_6rem_5rem_5rem_2rem] gap-2 items-center p-1 rounded-lg ${
                        isDup ? 'bg-red-500/10 ring-1 ring-red-500/30' : ''
                      }`}
                    >
                      <input
                        type="text"
                        placeholder="Type (e.g. Duration)"
                        value={v.type}
                        onChange={(e) => handleVariationChange(idx, 'type', e.target.value)}
                        className={`w-full bg-black/50 rounded-lg border px-2.5 py-1.5 text-xs text-white ${
                          isDup ? 'border-red-500/50' : 'border-white/10'
                        }`}
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g. 1 Year)"
                        value={v.value}
                        onChange={(e) => handleVariationChange(idx, 'value', e.target.value)}
                        className={`w-full bg-black/50 rounded-lg border px-2.5 py-1.5 text-xs text-white ${
                          isDup ? 'border-red-500/50' : 'border-white/10'
                        }`}
                      />
                      <input
                        type="text"
                        placeholder="SKU"
                        value={v.sku || ''}
                        onChange={(e) => handleVariationChange(idx, 'sku', e.target.value.toUpperCase())}
                        className="w-full bg-black/50 rounded-lg border border-white/10 px-2 py-1.5 text-[10px] text-white font-mono"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        value={v.price}
                        onChange={(e) => handleVariationChange(idx, 'price', Number(e.target.value))}
                        className="w-full bg-black/50 rounded-lg border border-white/10 px-2 py-1.5 text-xs text-white font-mono"
                      />
                      <input
                        type="number"
                        step="1"
                        placeholder="Stock"
                        value={v.stock ?? 0}
                        onChange={(e) => handleVariationChange(idx, 'stock', Number(e.target.value))}
                        className="w-full bg-black/50 rounded-lg border border-white/10 px-2 py-1.5 text-xs text-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveVariation(idx)}
                        className="p-2 text-neutral-400 hover:text-red-400 transition-colors"
                        aria-label={`Remove variation ${idx + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. Physical Projector Hardware Specs (Only if physical_projector) */}
            {productType === 'physical_projector' && (
              <div className="p-4 rounded-2xl bg-[#141622] border border-red-500/30 space-y-3">
                <div className="font-bold text-red-400 font-display flex items-center gap-1.5">
                  <Projector className="w-4 h-4" />
                  <span>Hardware Projector Specifications</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-neutral-400 text-[11px] mb-1">Native Resolution</label>
                    <input
                      type="text"
                      value={nativeResolution}
                      onChange={(e) => setNativeResolution(e.target.value)}
                      className="w-full bg-black/50 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 text-[11px] mb-1">Brightness (ANSI)</label>
                    <input
                      type="text"
                      value={brightness}
                      onChange={(e) => setBrightness(e.target.value)}
                      className="w-full bg-black/50 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 text-[11px] mb-1">Throw Ratio</label>
                    <input
                      type="text"
                      value={throwRatio}
                      onChange={(e) => setThrowRatio(e.target.value)}
                      className="w-full bg-black/50 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 text-[11px] mb-1">Operating System</label>
                    <input
                      type="text"
                      value={operatingSystem}
                      onChange={(e) => setOperatingSystem(e.target.value)}
                      className="w-full bg-black/50 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 text-[11px] mb-1">RAM / Storage</label>
                    <input
                      type="text"
                      value={`${ram} / ${storage}`}
                      onChange={(e) => {
                        const parts = e.target.value.split('/');
                        setRam(parts[0]?.trim() || '4GB');
                        setStorage(parts[1]?.trim() || '64GB');
                      }}
                      className="w-full bg-black/50 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 text-[11px] mb-1">Acoustic Specs</label>
                    <input
                      type="text"
                      value={speakerSpecs}
                      onChange={(e) => setSpeakerSpecs(e.target.value)}
                      className="w-full bg-black/50 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-semibold"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white text-xs font-bold font-display shadow-lg shadow-red-600/30 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{isEditing ? 'Save Changes' : 'Create Product'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

/**
 * Lightweight inline live-preview card.
 * Reuses the storefront's premium ProductCard styling tokens without
 * mounting the full interactive ProductCard (which would require the
 * auth + cart store). Shows a static snapshot of how the card will
 * appear on the storefront: image, badges, title, price, status.
 */
const LivePreviewCard: React.FC<{ product: Product }> = ({ product }) => {
  const hasDiscount = product.compareAtPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;
  const isPhysical = product.productType === 'physical_projector';
  const stockState: 'out' | 'low' | 'healthy' =
    product.stock <= 0 ? 'out' : product.stock <= product.lowStockThreshold ? 'low' : 'healthy';

  const promoTag: { text: string; color: 'red' | 'yellow' | 'green' | 'blue' | 'silver' } | null = (() => {
    if (product.offerBadgeText) return { text: product.offerBadgeText, color: product.offerBadgeColor || 'red' };
    if (product.isFlashDeal) return { text: 'FLASH DEAL', color: 'red' };
    if (product.isLimitedTime) return { text: 'LIMITED', color: 'yellow' };
    if (product.isBestSeller) return { text: 'BEST SELLER', color: 'yellow' };
    if (product.isTrendingWeek) return { text: 'TRENDING', color: 'blue' };
    if (product.isFeatured) return { text: 'FEATURED', color: 'silver' };
    return null;
  })();

  return (
    <article className="pb-product-card flex flex-col h-full" aria-label="Live preview">
      <div className="relative aspect-[4/3] bg-[var(--pb-charcoal-2)] overflow-hidden rounded-t-[var(--pb-radius-lg)] border-b border-[var(--pb-line)]">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="pb-image-fallback w-full h-full" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--pb-ink)] via-transparent to-transparent opacity-60 pointer-events-none" />
        <div className="absolute top-2.5 left-2.5 z-10">
          {hasDiscount ? (
            <span className="pb-badge pb-badge-red">-{discountPercent}%</span>
          ) : promoTag ? (
            <span className={`pb-badge pb-badge-${promoTag.color}`}>{promoTag.text}</span>
          ) : isPhysical ? (
            <span className="pb-badge pb-badge-blue">4K</span>
          ) : (
            <span className="pb-badge pb-badge-green">Instant</span>
          )}
        </div>
        {stockState === 'out' && (
          <div className="absolute inset-0 bg-black/55 flex items-center justify-center z-10">
            <span className="pb-badge pb-badge-red">Out of Stock</span>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-3.5 gap-2">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-[var(--pb-gold)] flex items-center gap-1">
            ★ <span className="text-white font-bold">{product.rating}</span>
            <span className="text-[var(--pb-silver-3)]">({product.reviewCount})</span>
          </span>
          <span className="text-[var(--pb-silver-4)] uppercase">{product.categoryName}</span>
        </div>

        <h3 className="font-semibold text-white text-[13px] leading-snug line-clamp-2 min-h-[2.4em]">
          {product.title}
        </h3>

        <p className="text-[11px] text-[var(--pb-silver-3)] line-clamp-1 min-h-[1.1em]">
          {product.shortDescription}
        </p>

        <div className="flex-1" />

        <span className={`pb-status ${
          stockState === 'out' ? 'pb-status-out-stock'
          : stockState === 'low' ? 'pb-status-low-stock'
          : 'pb-status-in-stock'
        }`}>
          {stockState === 'out' ? 'Out of stock'
            : stockState === 'low' ? `Only ${product.stock} left`
            : 'In stock'}
        </span>

        <div className="flex items-baseline gap-2 flex-wrap pt-1">
          <span className="pb-price-current">${product.price.toFixed(2)}</span>
          {hasDiscount && (
            <>
              <span className="pb-price-original">${product.compareAtPrice.toFixed(2)}</span>
              <span className="pb-badge pb-badge-red">-{discountPercent}%</span>
            </>
          )}
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-2 pt-2">
          <div className="pb-btn pb-btn-primary pb-btn-sm pb-btn-block">
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Add to Cart</span>
          </div>
          <div className="pb-btn pb-btn-secondary pb-btn-sm">
            <Eye className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </article>
  );
};
