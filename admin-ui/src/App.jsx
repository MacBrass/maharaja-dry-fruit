import { useState, useEffect, useMemo } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Package, ShoppingCart, LogOut, Download, Search, ChevronDown, AlertTriangle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './index.css'

// ============================================================
// AUTH
// ============================================================

const useAuth = () => {
  const [token, setToken] = useState(localStorage.getItem('adminToken'))
  const login = (token) => {
    localStorage.setItem('adminToken', token)
    setToken(token)
  }
  const logout = () => {
    localStorage.removeItem('adminToken')
    setToken(null)
  }
  return { token, login, logout }
}

const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('adminToken')
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
  const res = await fetch(url, { ...options, headers })
  if (res.status === 401) {
    localStorage.removeItem('adminToken')
    window.location.href = '/admin/login'
  }
  return res.json()
}

// Low stock threshold constant
const LOW_STOCK_THRESHOLD = 10

// ============================================================
// LOGIN — with inline validation, loading state, no alert()
// ============================================================

const Login = ({ login }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  const validate = () => {
    const errs = {}
    if (!email.trim()) errs.email = 'Please enter your email address.'
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Please enter a valid email address.'
    if (!password) errs.password = 'Please enter your password.'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setIsLoading(true)
    setErrors({})

    try {
      const data = await fetchWithAuth('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      })
      if (data.token) {
        login(data.token)
      } else {
        setErrors({ form: 'Your email or password is incorrect.' })
      }
    } catch {
      setErrors({ form: 'Unable to connect. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded border border-gray-200 shadow-sm w-96">
        <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">Admin Login</h2>

        {errors.form && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {errors.form}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
          <input
            className={`w-full border p-2 rounded focus:outline-none transition-colors ${errors.email ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-gray-500'}`}
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); if (errors.email) setErrors(prev => ({...prev, email: undefined})) }}
            placeholder="admin@maharaja.com"
          />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1 text-gray-700">Password</label>
          <input
            className={`w-full border p-2 rounded focus:outline-none transition-colors ${errors.password ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-gray-500'}`}
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); if (errors.password) setErrors(prev => ({...prev, password: undefined})) }}
            placeholder="Enter your password"
          />
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
        </div>

        <button
          disabled={isLoading}
          className="w-full bg-gray-900 text-white font-medium py-2 rounded hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Logging in…' : 'Login'}
        </button>
      </form>
    </div>
  )
}

// ============================================================
// LAYOUT — sidebar (preserved)
// ============================================================

const Layout = ({ logout, children }) => {
  const location = useLocation()
  const links = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/inventory', icon: Package, label: 'Inventory' },
    { path: '/admin/orders', icon: ShoppingCart, label: 'Orders Kanban' },
  ]

  return (
    <div className="flex h-screen bg-[#fbfbfb]">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-5 border-b border-gray-200">
          <h1 className="font-semibold text-lg text-gray-900">Maharaja Admin</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {links.map(l => (
            <Link key={l.path} to={l.path} className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === l.path ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>
              <l.icon size={18} />
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button onClick={logout} className="flex items-center gap-3 text-sm font-medium text-red-600 w-full px-3 py-2 hover:bg-red-50 rounded-md transition-colors">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  )
}

// ============================================================
// DASHBOARD (preserved, enhanced)
// ============================================================

const Dashboard = () => {
  const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, outOfStockProducts: 0, pendingOrders: 0 })
  const [recentOrders, setRecentOrders] = useState([])
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    fetchWithAuth('/api/admin/dashboard').then(setStats)
    fetchWithAuth('/api/admin/orders').then(orders => {
      setRecentOrders(orders.slice(0, 5))
      
      // Aggregate revenue by date for the chart, ignoring cancelled orders
      const revenueByDate = {}
      orders.forEach(o => {
        if (o.status === 'Cancelled' || o.status === 'CANCELLED') return;
        const date = new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        if (!revenueByDate[date]) revenueByDate[date] = 0
        revenueByDate[date] += o.totalAmount
      })
      
      const data = Object.keys(revenueByDate).map(date => ({
        date,
        revenue: revenueByDate[date]
      })).reverse().slice(-14)
      
      setChartData(data)
    })
    fetchWithAuth('/api/admin/inventory').then(products => {
      const sorted = products.sort((a, b) => a.stock - b.stock)
      setStats(prev => ({ ...prev, inventory: sorted.slice(0, 5) }))
    })
  }, [])

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6 text-gray-900">Dashboard</h1>
      
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Total Revenue</p>
          <p className="text-2xl font-semibold text-gray-900">₹{stats.totalRevenue.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Total Orders</p>
          <p className="text-2xl font-semibold text-gray-900">{stats.totalOrders}</p>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Pending Orders</p>
          <p className="text-2xl font-semibold text-gray-900">{stats.pendingOrders}</p>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-red-500 text-xs font-medium uppercase tracking-wider mb-1">Out of Stock</p>
          <p className="text-2xl font-semibold text-red-600">{stats.outOfStockProducts}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="col-span-2 bg-white border border-gray-200 rounded-lg shadow-sm p-5">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Revenue Overview</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} tickFormatter={value => `₹${value}`} dx={-10} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Line type="monotone" dataKey="revenue" stroke="#111827" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-1 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-lg font-medium text-gray-900">Recent Orders</h2>
          </div>
          <div className="p-0 overflow-y-auto flex-1">
            {recentOrders.length === 0 ? (
              <div className="p-5 text-center text-gray-500 text-sm">No recent orders</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {recentOrders.map(order => (
                  <li key={order.id} className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{order.customerName || 'Guest'}</p>
                      <p className="text-xs text-gray-500">Order #{order.id} • {new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">₹{order.totalAmount}</p>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${order.status?.toLowerCase() === 'pending' ? 'bg-amber-100 text-amber-700' : order.status?.toLowerCase() === 'delivered' ? 'bg-emerald-100 text-emerald-700' : order.status?.toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                        {order.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Low Stock Alerts</h2>
          <Link to="/admin/inventory" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">View All Inventory &rarr;</Link>
        </div>
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 font-medium text-gray-500 uppercase tracking-wider text-xs">Product</th>
                <th className="p-4 font-medium text-gray-500 uppercase tracking-wider text-xs">Category</th>
                <th className="p-4 font-medium text-gray-500 uppercase tracking-wider text-xs">Price</th>
                <th className="p-4 font-medium text-gray-500 uppercase tracking-wider text-xs">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.inventory?.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium text-gray-900">{p.name}</td>
                  <td className="p-4 text-gray-500">{p.category?.name || p.categoryId}</td>
                  <td className="p-4 font-medium text-gray-900">₹{p.price}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${p.stock <= 10 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                      {p.stock} remaining
                    </span>
                  </td>
                </tr>
              ))}
              {!stats.inventory?.length && (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">No inventory data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// INVENTORY — enhanced with KPI cards, search, stock filters
// ============================================================

const Inventory = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add')

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [stockFilter, setStockFilter] = useState('all') // all | inStock | lowStock | outOfStock
  const [sortOrder, setSortOrder] = useState('newest') // newest | name-asc | name-desc | price-asc | price-desc | stock-asc
  
  const [formData, setFormData] = useState({
    id: '', name: '', price: '', oldPrice: '', isOnOffer: false, categoryId: '', stock: '', image: null, imageId: ''
  })

  useEffect(() => {
    fetchWithAuth('/api/admin/inventory').then(setProducts)
    fetch('/api/products').then(res => res.json()).then(data => setCategories(data.categories))
  }, [])

  // ---- KPI calculations (dynamic from products array) ----
  const kpis = useMemo(() => {
    const total = products.length
    const inStock = products.filter(p => p.stock > LOW_STOCK_THRESHOLD).length
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD).length
    const outOfStock = products.filter(p => p.stock <= 0).length
    const totalValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0)
    return { total, inStock, lowStock, outOfStock, totalValue }
  }, [products])

  // ---- Filtering pipeline ----
  const filteredProducts = useMemo(() => {
    let items = products

    // 1. Category tab
    if (activeTab !== 'all') {
      items = items.filter(p => p.categoryId === activeTab)
    }

    // 2. Search (name, category name, product ID as pseudo-SKU)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      items = items.filter(p => {
        const catName = categories.find(c => c.id === p.categoryId)?.name || ''
        return (
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          catName.toLowerCase().includes(q)
        )
      })
    }

    // 3. Stock status filter
    if (stockFilter === 'inStock') items = items.filter(p => p.stock > LOW_STOCK_THRESHOLD)
    else if (stockFilter === 'lowStock') items = items.filter(p => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD)
    else if (stockFilter === 'outOfStock') items = items.filter(p => p.stock <= 0)

    // 4. Sort
    items = [...items].sort((a, b) => {
      switch (sortOrder) {
        case 'name-asc': return a.name.localeCompare(b.name)
        case 'name-desc': return b.name.localeCompare(a.name)
        case 'price-asc': return a.price - b.price
        case 'price-desc': return b.price - a.price
        case 'stock-asc': return a.stock - b.stock
        default: return 0 // newest: already ordered by createdAt desc from API
      }
    })

    return items
  }, [products, activeTab, searchQuery, stockFilter, sortOrder, categories])

  const openModal = (mode, product = null) => {
    setModalMode(mode)
    if (mode === 'edit' && product) {
      setFormData({
        id: product.id,
        name: product.name,
        price: product.price,
        oldPrice: product.oldPrice || '',
        isOnOffer: product.isOnOffer,
        categoryId: product.categoryId,
        stock: product.stock,
        imageId: product.imageId,
        image: null
      })
    } else {
      setFormData({ id: '', name: '', price: '', oldPrice: '', isOnOffer: false, categoryId: categories[0]?.id || '', stock: '100', image: null, imageId: '' })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const fd = new FormData()
    Object.keys(formData).forEach(k => {
      if (k === 'image' && formData[k]) {
        fd.append('image', formData[k])
      } else if (k !== 'image') {
        fd.append(k, formData[k])
      }
    })

    const url = modalMode === 'add' ? '/api/admin/inventory' : `/api/admin/inventory/${formData.id}`
    const method = modalMode === 'add' ? 'POST' : 'PUT'
    const token = localStorage.getItem('adminToken')

    const res = await fetch(url, {
      method,
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: fd
    })
    
    if (res.ok) {
      const updated = await res.json()
      if (modalMode === 'add') {
        setProducts([updated, ...products])
      } else {
        setProducts(products.map(p => p.id === updated.id ? updated : p))
      }
      setIsModalOpen(false)
    } else {
      const err = await res.json()
      alert(err.error)
    }
  }

  const handleDelete = async (id) => {
    if(!confirm('Are you sure you want to delete this product?')) return;
    const res = await fetchWithAuth(`/api/admin/inventory/${id}`, { method: 'DELETE' })
    if(res.success) setProducts(products.filter(p => p.id !== id))
  }

  const calculateDiscount = () => {
    if (formData.oldPrice && formData.price) {
      const oldP = parseFloat(formData.oldPrice)
      const newP = parseFloat(formData.price)
      if (oldP > newP) return Math.round(((oldP - newP) / oldP) * 100)
    }
    return 0
  }

  const getStockBadge = (stock) => {
    if (stock <= 0) return { cls: 'bg-red-50 text-red-600 border border-red-100', label: 'Out of stock' }
    if (stock <= LOW_STOCK_THRESHOLD) return { cls: 'bg-amber-50 text-amber-700 border border-amber-100', label: `${stock} — Low` }
    return { cls: 'bg-emerald-50 text-emerald-600 border border-emerald-100', label: `${stock} in stock` }
  }

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto">

      {/* ── Page Header ── */}
      <div className="flex justify-between items-start mb-5">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Inventory Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your products, stock levels and inventory</p>
        </div>
        <button onClick={() => openModal('add')} className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded font-medium transition-colors text-sm">
          + Add Product
        </button>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-5 gap-4 mb-5">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-2xl font-semibold text-gray-900">{kpis.total}</p>
          <p className="text-xs text-gray-500 mt-0.5">All active products</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-2xl font-semibold text-emerald-600">{kpis.inStock}</p>
          <p className="text-xs text-gray-500 mt-0.5">Products available</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-amber-200 shadow-sm">
          <p className="text-2xl font-semibold text-amber-600">{kpis.lowStock}</p>
          <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1"><AlertTriangle size={11} /> Need restocking</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-red-200 shadow-sm">
          <p className="text-2xl font-semibold text-red-600">{kpis.outOfStock}</p>
          <p className="text-xs text-red-500 mt-0.5">Not available</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-2xl font-semibold text-gray-900">₹{kpis.totalValue.toLocaleString('en-IN')}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total inventory value</p>
        </div>
      </div>

      {/* ── Category Tabs (preserved, enhanced with counts) ── */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-3 scrollbar-hide">
        <button onClick={() => setActiveTab('all')} className={`px-4 py-1.5 rounded text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'all' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
          All Products <span className="ml-1 opacity-70">{products.length}</span>
        </button>
        {categories.map(c => {
          const count = products.filter(p => p.categoryId === c.id).length
          return (
            <button key={c.id} onClick={() => setActiveTab(c.id)} className={`px-4 py-1.5 rounded text-sm font-medium transition-all whitespace-nowrap ${activeTab === c.id ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              {c.emoji} {c.name} <span className="ml-1 opacity-70">{count}</span>
            </button>
          )
        })}
      </div>

      {/* ── Search + Filters ── */}
      <div className="flex gap-3 mb-4 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, SKU or category…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-400 bg-white"
          />
        </div>

        <div className="relative">
          <select
            value={stockFilter}
            onChange={e => setStockFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded text-sm bg-white focus:outline-none focus:border-gray-400 cursor-pointer"
          >
            <option value="all">All Stock</option>
            <option value="inStock">In Stock</option>
            <option value="lowStock">Low Stock</option>
            <option value="outOfStock">Out of Stock</option>
          </select>
          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded text-sm bg-white focus:outline-none focus:border-gray-400 cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="name-asc">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
            <option value="price-asc">Price Low–High</option>
            <option value="price-desc">Price High–Low</option>
            <option value="stock-asc">Stock Low–High</option>
          </select>
          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        <span className="text-xs text-gray-400 ml-auto">{filteredProducts.length} result{filteredProducts.length !== 1 && 's'}</span>
      </div>

      {/* ── Product Table (preserved) ── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="p-4 font-medium text-gray-500 uppercase tracking-wider text-xs">Image</th>
                <th className="p-4 font-medium text-gray-500 uppercase tracking-wider text-xs">Product</th>
                <th className="p-4 font-medium text-gray-500 uppercase tracking-wider text-xs">Category</th>
                <th className="p-4 font-medium text-gray-500 uppercase tracking-wider text-xs">Price</th>
                <th className="p-4 font-medium text-gray-500 uppercase tracking-wider text-xs">Stock</th>
                <th className="p-4 font-medium text-gray-500 uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map(p => {
                const badge = getStockBadge(p.stock)
                return (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 w-16">
                    {p.imageId ? <img src={`/images/${p.imageId}${p.imageId.includes('.') ? '' : '.jpg'}`} className="w-10 h-10 object-cover rounded border border-gray-200" /> : <div className="w-10 h-10 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-lg">{p.category?.emoji || '📦'}</div>}
                  </td>
                  <td className="p-4">
                    <p className="font-medium text-gray-900">{p.name}</p>
                    {p.isOnOffer && <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-gray-100 text-gray-600 border border-gray-200 text-[10px] rounded uppercase font-semibold">Offer</span>}
                  </td>
                  <td className="p-4 text-gray-500">{categories.find(c => c.id === p.categoryId)?.name || p.categoryId}</td>
                  <td className="p-4">
                    <div className="font-medium text-gray-900">₹{p.price}</div>
                    {p.isOnOffer && p.oldPrice && <div className="text-xs text-gray-400 line-through">₹{p.oldPrice}</div>}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-3">
                    <button onClick={() => openModal('edit', p)} className="text-gray-500 hover:text-gray-900 font-medium transition-colors">Edit</button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700 font-medium transition-colors">Delete</button>
                  </td>
                </tr>
              )})}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-gray-400 text-sm">No products found matching your criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add/Edit Modal (preserved) ── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">{modalMode === 'add' ? 'Add Product' : 'Edit Product'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 text-xl leading-none transition-colors">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <input required className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-gray-500 transition-colors text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select required className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-gray-500 transition-colors text-sm bg-white" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})}>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                    <input required type="number" className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-gray-500 transition-colors text-sm" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <input type="checkbox" id="isOnOffer" className="w-4 h-4 text-gray-900 rounded border-gray-300 focus:ring-gray-900" checked={formData.isOnOffer} onChange={e => setFormData({...formData, isOnOffer: e.target.checked})} />
                    <label htmlFor="isOnOffer" className="font-medium text-gray-900 text-sm cursor-pointer">Active Offer / Discount</label>
                  </div>
                  
                  {formData.isOnOffer && (
                    <div className="grid grid-cols-3 gap-4 items-end">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Old Price (₹)</label>
                        <input type="number" step="0.01" className="w-full border border-gray-300 p-2 rounded outline-none text-sm focus:border-gray-500 transition-colors bg-white" value={formData.oldPrice} onChange={e => setFormData({...formData, oldPrice: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Sale Price (₹)</label>
                        <input required type="number" step="0.01" className="w-full border border-gray-300 p-2 rounded outline-none text-sm focus:border-gray-500 transition-colors bg-white" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                      </div>
                      <div className="bg-gray-900 text-white p-2 rounded text-center font-semibold text-sm">
                        {calculateDiscount()}% OFF
                      </div>
                    </div>
                  )}
                  {!formData.isOnOffer && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Standard Price (₹)</label>
                      <input required type="number" step="0.01" className="w-full border border-gray-300 p-2 rounded outline-none text-sm focus:border-gray-500 transition-colors bg-white" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
                  <div className="border border-dashed border-gray-300 rounded p-4 text-center hover:bg-gray-50 transition-all cursor-pointer">
                    {formData.imageId && !formData.image && <img src={`/images/${formData.imageId}${formData.imageId.includes('.') ? '' : '.jpg'}`} className="mx-auto h-20 object-contain mb-3 rounded shadow-sm border border-gray-200" />}
                    <input type="file" accept="image/*" onChange={e => setFormData({...formData, image: e.target.files[0]})} className="w-full text-xs text-gray-600 file:mr-4 file:py-1.5 file:px-4 file:rounded file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer" />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 font-medium hover:bg-gray-100 rounded transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2 text-sm bg-gray-900 hover:bg-gray-800 text-white font-medium rounded transition-colors">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// KANBAN (preserved)
// ============================================================

const Kanban = () => {
  const [orders, setOrders] = useState([])
  const token = localStorage.getItem('adminToken')

  useEffect(() => {
    fetchWithAuth('/api/admin/orders').then(setOrders)
  }, [])

  const updateStatus = async (id, status) => {
    await fetchWithAuth(`/api/admin/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    })
    setOrders(orders.map(o => o.id === id ? { ...o, status } : o))
  }

  const columns = ['Pending', 'Processing', 'Delivered', 'Cancelled']

  const getMappedStatus = (status) => {
    if (status === 'PENDING') return 'Pending'
    if (status === 'CONFIRMED' || status === 'IN PROGRESS') return 'Processing'
    if (status === 'COMPLETED') return 'Delivered'
    if (status === 'CANCELLED') return 'Cancelled'
    return status || 'Pending'
  }

  return (
    <div className="h-full flex flex-col max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6 text-gray-900 flex-none">Orders Kanban</h1>
      <div className="flex-1 flex gap-5 overflow-x-auto pb-4 scrollbar-hide">
        {columns.map(status => (
          <div key={status} className="w-72 flex-none bg-gray-100/50 rounded-lg p-2 border border-gray-200 flex flex-col max-h-[85vh]">
            <h3 className="font-semibold mb-2 flex justify-between items-center text-sm text-gray-800 px-1">
              {status}
              <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                {orders.filter(o => getMappedStatus(o.status) === status).length}
              </span>
            </h3>
            <div className="flex-1 space-y-2 overflow-y-auto px-1 scrollbar-hide">
              {orders.filter(o => getMappedStatus(o.status) === status).map(order => (
                <div key={order.id} className="bg-white p-3 rounded shadow-sm border border-gray-200 hover:border-gray-300 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm text-gray-900">Order #{order.id}</span>
                    <span className="text-sm font-semibold text-gray-900">₹{order.totalAmount}</span>
                  </div>
                  
                  <div className="text-xs text-gray-500 mb-2 space-y-1">
                    <p className="font-medium text-gray-700">{order.customerName || 'Guest'}</p>
                    <p className="truncate" title={order.items.map(i => `${i.product?.name} (x${i.quantity})`).join(', ')}>
                      {order.items.length} items: <span className="text-gray-400">{order.items.map(i => i.product?.name).join(', ')}</span>
                    </p>
                    {order.customerAddress && <p className="truncate text-gray-400" title={order.customerAddress}>{order.customerAddress}</p>}
                  </div>
                  
                  <div className="flex gap-2">
                    <select 
                      className="text-xs flex-1 p-1 border border-gray-200 rounded outline-none focus:border-gray-400 bg-gray-50"
                      value={getMappedStatus(order.status)}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                    >
                      {columns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <a 
                      href={`/api/admin/orders/${order.id}/invoice?token=${token}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-1 px-2 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 rounded flex items-center justify-center transition-colors"
                      title="Download PDF Invoice"
                    >
                      <Download size={14} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// APP ROUTER (preserved)
// ============================================================

function App() {
  const { token, login, logout } = useAuth()

  if (!token) {
    return <Login login={login} />
  }

  return (
    <BrowserRouter>
      <Layout logout={logout}>
        <Routes>
          <Route path="/" element={<Navigate to="/admin/dashboard" />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" />} />
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/inventory" element={<Inventory />} />
          <Route path="/admin/orders" element={<Kanban />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
