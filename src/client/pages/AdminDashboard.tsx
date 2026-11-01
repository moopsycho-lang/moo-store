// src/client/pages/AdminDashboard.tsx
// Comprehensive Store Management Console for MOO Administrators

import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  AlertTriangle,
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  FileSpreadsheet,
  Download,
  Upload,
  RefreshCw,
  Search,
  Printer,
  RotateCcw,
  Tag,
  Star,
  Settings,
  Image as ImageIcon,
  Truck,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { InvoiceModal } from '../components/InvoiceModal.tsx';
import type {
  Product,
  Category,
  Brand,
  Order,
  OrderStatus,
  Coupon,
  InventoryLog,
  Review,
  ShippingZone,
  StoreSettings,
} from '../../types/index.ts';

interface AdminDashboardProps {
  onNavigate: (view: string, param?: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { user, accessToken, quickLogin } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'products' | 'orders' | 'customers' | 'inventory' | 'promotions' | 'reviews' | 'reports' | 'settings'
  >('overview');

  // Overview metrics state
  const [overview, setOverview] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  const [reports, setReports] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockAdjustment, setStockAdjustment] = useState<{ productId: string; name: string; amount: number; reason: string }>({
    productId: '',
    name: '',
    amount: 0,
    reason: 'Restock inventory',
  });
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundOrder, setRefundOrder] = useState<{ id: string; orderNumber: string; reason: string; restock: boolean }>({
    id: '',
    orderNumber: '',
    reason: 'Customer requested refund',
    restock: true,
  });

  // Filters state
  const [productSearch, setProductSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');
  const [customerSearch, setCustomerSearch] = useState('');

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  }), [accessToken]);

  // Load data
  const loadData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [ovRes, prodRes, catRes, brnRes, ordRes, custRes, invRes, coupRes, revRes, setRes, repRes] =
        await Promise.all([
          fetch('/api/admin/overview', { headers: authHeaders() }).then(r => (r.ok ? r.json() : null)),
          fetch('/api/admin/products?limit=100', { headers: authHeaders() }).then(r => (r.ok ? r.json() : null)),
          fetch('/api/admin/categories', { headers: authHeaders() }).then(r => (r.ok ? r.json() : [])),
          fetch('/api/admin/brands', { headers: authHeaders() }).then(r => (r.ok ? r.json() : [])),
          fetch('/api/admin/orders', { headers: authHeaders() }).then(r => (r.ok ? r.json() : [])),
          fetch('/api/admin/customers', { headers: authHeaders() }).then(r => (r.ok ? r.json() : [])),
          fetch('/api/admin/inventory', { headers: authHeaders() }).then(r => (r.ok ? r.json() : null)),
          fetch('/api/admin/coupons', { headers: authHeaders() }).then(r => (r.ok ? r.json() : [])),
          fetch('/api/admin/reviews', { headers: authHeaders() }).then(r => (r.ok ? r.json() : [])),
          fetch('/api/admin/settings', { headers: authHeaders() }).then(r => (r.ok ? r.json() : null)),
          fetch('/api/admin/reports', { headers: authHeaders() }).then(r => (r.ok ? r.json() : null)),
        ]);

      if (ovRes) setOverview(ovRes);
      if (prodRes?.products) setProducts(prodRes.products);
      if (catRes) setCategories(catRes);
      if (brnRes) setBrands(brnRes);
      if (ordRes) setOrders(ordRes);
      if (custRes) setCustomers(custRes);
      if (invRes?.logs) setInventoryLogs(invRes.logs);
      if (coupRes) setCoupons(coupRes);
      if (revRes) setReviews(revRes);
      if (setRes) {
        setSettings(setRes.settings);
        setShippingZones(setRes.shippingZones || []);
      }
      if (repRes) setReports(repRes);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, authHeaders]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Guard: if user is not admin
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Admin Privileges Required</h2>
        <p className="text-xs text-neutral-500">
          This portal is reserved for store administrators. You can log in using the preconfigured admin demo credentials.
        </p>
        <button
          onClick={() => quickLogin('admin')}
          className="px-6 py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-xl text-xs font-semibold"
        >
          Sign In as Store Admin (Alex Moore)
        </button>
      </div>
    );
  }

  // --- Handlers ---
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus, trackingNumber?: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          status,
          trackingNumber,
          note: `Fulfillment status changed to ${status}`,
        }),
      });
      if (res.ok) {
        showToast(`Order status updated to ${status}`, 'success');
        loadData();
      }
    } catch {
      showToast('Error updating status', 'error');
    }
  };

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundOrder.id) return;
    try {
      const res = await fetch(`/api/admin/orders/${refundOrder.id}/refund`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          reason: refundOrder.reason,
          restock: refundOrder.restock,
        }),
      });
      if (res.ok) {
        showToast('Refund processed successfully', 'success');
        setIsRefundModalOpen(false);
        loadData();
      }
    } catch {
      showToast('Error processing refund', 'error');
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          productId: stockAdjustment.productId,
          changeAmount: Number(stockAdjustment.amount),
          reason: stockAdjustment.reason,
        }),
      });
      if (res.ok) {
        showToast('Inventory updated', 'success');
        setIsStockModalOpen(false);
        loadData();
      }
    } catch {
      showToast('Error updating inventory', 'error');
    }
  };

  const handleToggleCustomerBlock = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/customers/${id}/toggle-block`, {
        method: 'PUT',
        headers: authHeaders(),
      });
      if (res.ok) {
        showToast('Customer account status updated', 'info');
        loadData();
      }
    } catch {
      showToast('Error toggling block', 'error');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const isNew = !editingProduct.id;
    const url = isNew ? '/api/admin/products' : `/api/admin/products/${editingProduct.id}`;
    const method = isNew ? 'POST' : 'PUT';

    try {
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(editingProduct),
      });
      if (res.ok) {
        showToast(isNew ? 'Product created' : 'Product updated', 'success');
        setIsProductModalOpen(false);
        setEditingProduct(null);
        loadData();
      } else {
        const d = await res.json();
        showToast(d.error || 'Failed to save product', 'error');
      }
    } catch {
      showToast('Error saving product', 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (res.ok) {
        showToast('Product deleted', 'info');
        loadData();
      }
    } catch {
      showToast('Error deleting product', 'error');
    }
  };

  const handleReviewModerate = async (id: string, isApproved: boolean) => {
    try {
      const res = await fetch(`/api/admin/reviews/${id}/status`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ isApproved }),
      });
      if (res.ok) {
        showToast(isApproved ? 'Review approved' : 'Review hidden', 'info');
        loadData();
      }
    } catch {
      showToast('Error updating review', 'error');
    }
  };

  const handleExportCSV = () => {
    const header = 'OrderNumber,CustomerEmail,Total,Status,PaymentMethod,Date\n';
    const rows = orders.map(o => `"${o.orderNumber}","${o.customerEmail}",${o.total},"${o.status}","${o.paymentMethod}","${o.createdAt}"`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moo_orders_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    showToast('Orders exported to CSV', 'success');
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-20">
      {/* Admin Top Header */}
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('home')}
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
              title="Return to customer storefront"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <span className="bg-amber-600 text-white text-xs font-bold px-2 py-0.5 rounded uppercase font-mono">
                Admin
              </span>
              <span className="text-base font-bold text-neutral-900 dark:text-white">MOO Store Console</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Refresh data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('catalog')}
              className="text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:underline"
            >
              View Live Storefront
            </button>
          </div>
        </div>

        {/* Tab Navigation Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto py-2 text-xs font-medium">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'products', label: 'Products', icon: Package },
            { id: 'orders', label: 'Orders', icon: ShoppingCart },
            { id: 'customers', label: 'Customers', icon: Users },
            { id: 'inventory', label: 'Inventory', icon: AlertTriangle },
            { id: 'promotions', label: 'Coupons & Banners', icon: Tag },
            { id: 'reviews', label: 'Reviews', icon: Star },
            { id: 'reports', label: 'Reports', icon: TrendingUp },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* 1. Overview Tab */}
        {activeTab === 'overview' && overview && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 space-y-2">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Gross Revenue</span>
                <p className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-neutral-900 dark:text-white">
                  ${overview.metrics.totalRevenue.toFixed(2)}
                </p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">+18.4% this week</p>
              </div>

              <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 space-y-2">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Total Orders</span>
                <p className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-neutral-900 dark:text-white">
                  {overview.metrics.totalOrders}
                </p>
                <p className="text-[11px] text-neutral-500 font-medium">Avg ticket: ${overview.metrics.averageOrderValue.toFixed(2)}</p>
              </div>

              <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 space-y-2">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Patrons / Customers</span>
                <p className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-neutral-900 dark:text-white">
                  {overview.metrics.totalCustomers}
                </p>
                <p className="text-[11px] text-neutral-500 font-medium">Registered buyers</p>
              </div>

              <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 space-y-2">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Low Stock Warnings</span>
                <p className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-amber-600 dark:text-amber-400">
                  {overview.metrics.lowStockCount}
                </p>
                <p className="text-[11px] text-amber-600 font-medium">Requires factory replenishment</p>
              </div>
            </div>

            {/* Daily Revenue Chart & Top Products Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Daily Revenue Bar Visualizer */}
              <div className="lg:col-span-2 p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                  Revenue Velocity (Last 7 Days)
                </h3>
                <div className="h-48 flex items-end justify-between gap-3 pt-8 pb-2">
                  {overview.dailyRevenue.map((d: any, idx: number) => {
                    const max = Math.max(...overview.dailyRevenue.map((x: any) => x.revenue), 100);
                    const pct = Math.max(12, (d.revenue / max) * 100);
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                        <span className="font-mono text-[10px] text-neutral-500 tabular-nums">
                          ${d.revenue.toFixed(0)}
                        </span>
                        <div
                          className="w-full bg-neutral-900 dark:bg-white rounded-t-lg transition-all duration-300"
                          style={{ height: `${pct}%` }}
                        />
                        <span className="font-mono text-[11px] text-neutral-400">{d.date}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Products by Revenue */}
              <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                  Top-Selling Objects
                </h3>
                <div className="space-y-3">
                  {overview.topProducts.map((p: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-xs pb-2 border-b border-neutral-100 dark:border-neutral-800">
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-neutral-900 dark:text-white truncate">{p.name}</p>
                        <p className="text-[11px] text-neutral-400 font-mono">{p.units} units shipped</p>
                      </div>
                      <span className="font-mono font-bold tabular-nums text-neutral-900 dark:text-white">
                        ${p.revenue.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Orders Overview */}
            <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                  Recent Inbound Orders
                </h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:underline"
                >
                  View All Orders
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 uppercase font-semibold">
                      <th className="py-2.5">Order</th>
                      <th className="py-2.5">Customer</th>
                      <th className="py-2.5 font-mono">Total</th>
                      <th className="py-2.5">Status</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {overview.recentOrders.map((o: Order) => (
                      <tr key={o.id}>
                        <td className="py-3 font-mono font-bold text-neutral-900 dark:text-white">{o.orderNumber}</td>
                        <td className="py-3 text-neutral-600 dark:text-neutral-300">{o.customerName}</td>
                        <td className="py-3 font-mono tabular-nums text-neutral-900 dark:text-white font-bold">${o.total.toFixed(2)}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                            {o.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => setInvoiceOrder(o)}
                            className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white rounded-md text-[11px] font-semibold"
                          >
                            Invoice
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Product Inventory Catalog</h2>
                <p className="text-xs text-neutral-500">Manage SKUs, variants, prices, and publication status.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setEditingProduct({
                      name: '',
                      slug: '',
                      description: '',
                      price: 50,
                      costPrice: 20,
                      sku: `MOO-${Math.floor(1000 + Math.random() * 9000)}`,
                      stock: 25,
                      lowStockAlert: 5,
                      isPublished: true,
                      categoryId: categories[0]?.id || 'cat-home',
                      brandId: brands[0]?.id || 'brand-moo',
                      images: [{ id: 'img-new', productId: '', url: '/src/assets/images/moo_category_home_1793502193419.jpg', sortOrder: 0 }],
                      variants: [],
                      tags: ['Curated', 'New'],
                    });
                    setIsProductModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Product</span>
                </button>
              </div>
            </div>

            {/* Product Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 overflow-hidden">
              <div className="p-4 border-b border-neutral-100 dark:border-neutral-800">
                <input
                  type="text"
                  placeholder="Filter by product name, SKU, or category..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  className="w-full max-w-sm px-3.5 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 uppercase font-bold tracking-wider">
                      <th className="p-3">Object</th>
                      <th className="p-3 font-mono">SKU</th>
                      <th className="p-3">Category</th>
                      <th className="p-3 font-mono">Price</th>
                      <th className="p-3 font-mono">Stock</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {products
                      .filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku.toLowerCase().includes(productSearch.toLowerCase()))
                      .map(p => (
                        <tr key={p.id}>
                          <td className="p-3 flex items-center gap-3">
                            <img
                              src={p.images[0]?.url || '/src/assets/images/moo_category_home_1793502193419.jpg'}
                              alt={p.name}
                              className="w-10 h-10 object-cover rounded-lg bg-neutral-100 dark:bg-neutral-800 shrink-0"
                            />
                            <div>
                              <p className="font-semibold text-neutral-900 dark:text-white">{p.name}</p>
                              <p className="text-[11px] text-neutral-400">{p.brand?.name}</p>
                            </div>
                          </td>
                          <td className="p-3 font-mono text-neutral-500">{p.sku}</td>
                          <td className="p-3 text-neutral-600 dark:text-neutral-300">{p.category?.name}</td>
                          <td className="p-3 font-mono font-bold tabular-nums text-neutral-900 dark:text-white">${p.price.toFixed(2)}</td>
                          <td className="p-3">
                            <span className={`font-mono font-bold ${p.stock <= 5 ? 'text-amber-600' : 'text-neutral-900 dark:text-white'}`}>
                              {p.stock} units
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${p.isPublished ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-neutral-200 text-neutral-600'}`}>
                              {p.isPublished ? 'Active' : 'Draft'}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-2">
                            <button
                              onClick={() => {
                                setStockAdjustment({
                                  productId: p.id,
                                  name: p.name,
                                  amount: 10,
                                  reason: 'Direct shipment restock',
                                });
                                setIsStockModalOpen(true);
                              }}
                              className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-[11px] font-semibold"
                            >
                              Adjust Stock
                            </button>
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setIsProductModalOpen(true);
                              }}
                              className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-1.5 text-neutral-400 hover:text-rose-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Customer Orders & Fulfillment</h2>
                <p className="text-xs text-neutral-500">Track shipments, update statuses, print slips, and process refunds.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  className="px-3.5 py-2 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
              {['ALL', 'PENDING', 'PAID', 'PACKED', 'SHIPPED', 'DELIVERED', 'REFUNDED'].map(st => (
                <button
                  key={st}
                  onClick={() => setOrderStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg font-mono font-medium transition-colors ${
                    orderStatusFilter === st
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold'
                      : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {orders
                .filter(o => orderStatusFilter === 'ALL' || o.status === orderStatusFilter)
                .map(order => (
                  <div
                    key={order.id}
                    className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-bold text-neutral-900 dark:text-white">{order.orderNumber}</span>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded font-semibold">
                            {order.status}
                          </span>
                          <span className="text-xs text-neutral-400">({order.paymentMethod})</span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {order.customerName} · {order.customerEmail} · Placed {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={order.status}
                          onChange={e => handleUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                          className="px-2.5 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white font-mono"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="PAID">PAID</option>
                          <option value="PACKED">PACKED</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                          <option value="REFUNDED">REFUNDED</option>
                        </select>

                        <button
                          onClick={() => setInvoiceOrder(order)}
                          className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Slip</span>
                        </button>

                        {order.status !== 'REFUNDED' && (
                          <button
                            onClick={() => {
                              setRefundOrder({
                                id: order.id,
                                orderNumber: order.orderNumber,
                                reason: 'Customer requested cancellation/refund',
                                restock: true,
                              });
                              setIsRefundModalOpen(true);
                            }}
                            className="px-3 py-1.5 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            Refund
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Order summary info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="font-bold text-neutral-500 uppercase tracking-wider mb-1">Shipping Destination</p>
                        <p className="text-neutral-800 dark:text-neutral-200">{order.shippingAddress.fullName}</p>
                        <p className="text-neutral-500">{order.shippingAddress.line1}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                        {order.trackingNumber && (
                          <p className="font-mono text-neutral-600 dark:text-neutral-400 mt-1">Tracking #: {order.trackingNumber}</p>
                        )}
                      </div>

                      <div>
                        <p className="font-bold text-neutral-500 uppercase tracking-wider mb-1">Purchased Objects</p>
                        <div className="space-y-1">
                          {order.items.map((i, idx) => (
                            <div key={idx} className="flex justify-between text-neutral-700 dark:text-neutral-300">
                              <span>{i.name} (x{i.quantity})</span>
                              <span className="font-mono font-semibold">${(i.price * i.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between font-bold pt-1 border-t border-neutral-100 dark:border-neutral-800 text-neutral-900 dark:text-white">
                            <span>Total Charged</span>
                            <span className="font-mono">${order.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 4. Customers Tab */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Customer Accounts Directory</h2>
                <p className="text-xs text-neutral-500">View client activity, lifetime purchase value, and manage access.</p>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 uppercase font-bold tracking-wider">
                    <th className="p-3">Customer</th>
                    <th className="p-3">Email</th>
                    <th className="p-3 font-mono">Orders</th>
                    <th className="p-3 font-mono">Lifetime Spend</th>
                    <th className="p-3">Account Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {customers.map(c => (
                    <tr key={c.id}>
                      <td className="p-3 font-semibold text-neutral-900 dark:text-white">{c.name}</td>
                      <td className="p-3 text-neutral-500">{c.email}</td>
                      <td className="p-3 font-mono tabular-nums">{c.orderCount}</td>
                      <td className="p-3 font-mono font-bold tabular-nums text-neutral-900 dark:text-white">
                        ${c.totalSpent.toFixed(2)}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${c.isBlocked ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {c.isBlocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleToggleCustomerBlock(c.id)}
                          className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                            c.isBlocked
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          }`}
                        >
                          {c.isBlocked ? 'Unblock' : 'Block User'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Inventory Tracking & Audit Trail</h2>
              <p className="text-xs text-neutral-500">Review real-time stock levels, low inventory warnings, and automatic decrement logs.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Product Stock Table */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 p-5 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                  Stock Units Overview
                </h3>
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800 max-h-96 overflow-y-auto">
                  {products.map(p => (
                    <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-neutral-900 dark:text-white">{p.name}</p>
                        <p className="font-mono text-[11px] text-neutral-400">SKU: {p.sku}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-mono font-bold ${p.stock <= p.lowStockAlert ? 'text-amber-600' : 'text-neutral-900 dark:text-white'}`}>
                          {p.stock} units
                        </span>
                        <button
                          onClick={() => {
                            setStockAdjustment({
                              productId: p.id,
                              name: p.name,
                              amount: 10,
                              reason: 'Manual replenishment',
                            });
                            setIsStockModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white rounded text-[11px] font-semibold"
                        >
                          Adjust
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audit Logs */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 p-5 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                  Inventory Change Logs
                </h3>
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800 max-h-96 overflow-y-auto space-y-2">
                  {inventoryLogs.map(log => (
                    <div key={log.id} className="py-2 text-xs space-y-0.5">
                      <div className="flex justify-between items-baseline">
                        <span className="font-semibold text-neutral-900 dark:text-white">{log.productName}</span>
                        <span className={`font-mono font-bold ${log.changeAmount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {log.changeAmount > 0 ? `+${log.changeAmount}` : log.changeAmount} units
                        </span>
                      </div>
                      <p className="text-neutral-500 text-[11px]">{log.reason} · Admin: {log.adminName}</p>
                      <p className="font-mono text-[10px] text-neutral-400">{new Date(log.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. Promotions & Coupons Tab */}
        {activeTab === 'promotions' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Coupons & Promotional Codes</h2>
                <p className="text-xs text-neutral-500">Configure discount codes, expiry limits, and usage thresholds.</p>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 uppercase font-bold tracking-wider">
                    <th className="p-3 font-mono">Code</th>
                    <th className="p-3">Discount</th>
                    <th className="p-3 font-mono">Min Order</th>
                    <th className="p-3 font-mono">Usage</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {coupons.map(c => (
                    <tr key={c.id}>
                      <td className="p-3 font-mono font-bold text-neutral-900 dark:text-white">{c.code}</td>
                      <td className="p-3 text-emerald-600 dark:text-emerald-400 font-semibold">
                        {c.type === 'PERCENT' ? `${c.value}% OFF` : `$${c.value} OFF`}
                      </td>
                      <td className="p-3 font-mono">{c.minOrder ? `$${c.minOrder}` : 'None'}</td>
                      <td className="p-3 font-mono">{c.usedCount} uses</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${c.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-200 text-neutral-600'}`}>
                          {c.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7. Reviews Moderation */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Customer Reviews Moderation Queue</h2>
              <p className="text-xs text-neutral-500">Approve, hide, or delete patron submissions across all products.</p>
            </div>

            <div className="space-y-3">
              {reviews.map((r: any) => (
                <div key={r.id} className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-neutral-900 dark:text-white">{r.title}</span>
                        <span className="text-amber-500 font-bold text-xs">({r.rating}★)</span>
                        <span className={`px-2 py-0.2 rounded text-[10px] font-mono font-bold uppercase ${r.isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-600'}`}>
                          {r.isApproved ? 'Approved' : 'Hidden'}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Product: {r.product?.name || r.productId} · Author: {r.userName}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReviewModerate(r.id, !r.isApproved)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                          r.isApproved
                            ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {r.isApproved ? 'Hide Review' : 'Approve'}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">{r.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. Reports Tab */}
        {activeTab === 'reports' && reports && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Commercial Sales Reports</h2>
                <p className="text-xs text-neutral-500">Revenue generation segmented by product department.</p>
              </div>
              <button
                onClick={handleExportCSV}
                className="px-3.5 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Transaction Log</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reports.categoryBreakdown.map((cat: any, idx: number) => (
                <div key={idx} className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">{cat.categoryName}</h3>
                  <p className="text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-white">
                    ${cat.totalRevenue.toFixed(2)}
                  </p>
                  <p className="text-xs text-neutral-500 font-mono">{cat.unitsSold} units dispatched</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 9. Settings Tab */}
        {activeTab === 'settings' && settings && (
          <div className="max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 p-6 sm:p-8 space-y-6">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Store Configuration & Tax Parameters</h2>
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Store Brand Name</label>
                <input
                  type="text"
                  value={settings.storeName}
                  onChange={e => setSettings({ ...settings, storeName: e.target.value })}
                  className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Currency Code</label>
                  <input
                    type="text"
                    value={settings.currency}
                    onChange={e => setSettings({ ...settings, currency: e.target.value })}
                    className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Tax Rate (e.g. 0.08 = 8%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.taxRate}
                    onChange={e => setSettings({ ...settings, taxRate: parseFloat(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Free Shipping Threshold ($)</label>
                <input
                  type="number"
                  value={settings.freeShippingThreshold}
                  onChange={e => setSettings({ ...settings, freeShippingThreshold: parseFloat(e.target.value) })}
                  className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Customer Support Email</label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={e => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl"
                />
              </div>
              <button
                type="button"
                onClick={async () => {
                  await fetch('/api/admin/settings', {
                    method: 'PUT',
                    headers: authHeaders(),
                    body: JSON.stringify(settings),
                  });
                  showToast('Store settings updated', 'success');
                }}
                className="px-5 py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-xl font-semibold"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Stock Adjustment Modal */}
      {isStockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Adjust Stock: {stockAdjustment.name}
            </h3>
            <form onSubmit={handleAdjustStock} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Change Amount (+ to add, - to subtract)
                </label>
                <input
                  type="number"
                  required
                  value={stockAdjustment.amount}
                  onChange={e => setStockAdjustment({ ...stockAdjustment, amount: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Audit Reason</label>
                <input
                  type="text"
                  required
                  value={stockAdjustment.reason}
                  onChange={e => setStockAdjustment({ ...stockAdjustment, reason: e.target.value })}
                  className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStockModalOpen(false)}
                  className="px-4 py-2 text-neutral-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-xl font-semibold"
                >
                  Record Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {isRefundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Process Refund for {refundOrder.orderNumber}
            </h3>
            <form onSubmit={handleProcessRefund} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Refund Reason</label>
                <input
                  type="text"
                  required
                  value={refundOrder.reason}
                  onChange={e => setRefundOrder({ ...refundOrder, reason: e.target.value })}
                  className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="restock-check"
                  checked={refundOrder.restock}
                  onChange={e => setRefundOrder({ ...refundOrder, restock: e.target.checked })}
                />
                <label htmlFor="restock-check">Return items to active store inventory</label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRefundModalOpen(false)}
                  className="px-4 py-2 text-neutral-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 text-white rounded-xl font-semibold"
                >
                  Confirm Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Edit / Create Modal */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-4 my-8">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              {editingProduct.id ? `Edit: ${editingProduct.name}` : 'Create New Product'}
            </h3>
            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })}
                  className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">URL Slug</label>
                <input
                  type="text"
                  required
                  value={editingProduct.slug || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, slug: e.target.value })}
                  className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={editingProduct.description || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingProduct.price || 0}
                    onChange={e => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Compare At ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.compareAtPrice || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, compareAtPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Stock Units</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.stock || 0}
                    onChange={e => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Category</label>
                  <select
                    value={editingProduct.categoryId || categories[0]?.id}
                    onChange={e => setEditingProduct({ ...editingProduct, categoryId: e.target.value })}
                    className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Brand</label>
                  <select
                    value={editingProduct.brandId || brands[0]?.id}
                    onChange={e => setEditingProduct({ ...editingProduct, brandId: e.target.value })}
                    className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl"
                  >
                    {brands.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 text-neutral-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-xl font-semibold"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal for any order */}
      <InvoiceModal order={invoiceOrder} onClose={() => setInvoiceOrder(null)} />
    </div>
  );
};
