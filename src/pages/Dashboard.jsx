import { useEffect, useState } from 'react'
import { ref, onValue } from 'firebase/database'
import { signOut } from 'firebase/auth'
import { db, auth } from '../firebase'
import { useAuth } from '../context/AuthContext'
import './Dashboard.css'

function useRealtime(path) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const r = ref(db, path)
    const unsub = onValue(
      r,
      (snap) => {
        setData(snap.val())
        setError(null)
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setData(null)
        setLoading(false)
      }
    )
    return () => unsub()
  }, [path])

  return { data, error, loading }
}

function Overview({ customersData, productsData, ordersCount }) {
  const customersCount = customersData && typeof customersData === 'object' ? Object.keys(customersData).length : 0
  const productsCount = productsData && typeof productsData === 'object' ? Object.keys(productsData).length : 0

  return (
    <section className="dashboard-content">
      <h2 className="page-title">Suhatika Sarees Overview</h2>
      <div className="summary-cards">
        <div className="summary-card">
          <span className="summary-label">Total Customers</span>
          <span className="summary-value">{customersCount}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Products</span>
          <span className="summary-value">{productsCount}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Orders</span>
          <span className="summary-value">{ordersCount}</span>
        </div>
      </div>
    </section>
  )
}

function getProductName(products, productId) {
  if (!products || !productId) return productId || '—'
  const p = products[productId] ?? Object.values(products || {}).find((x) => (x?.id ?? x?.productId) === productId)
  return p?.name ?? p?.title ?? productId
}

function formatOrderedItems(items, products) {
  if (!items || !Array.isArray(items)) return '—'
  return items
    .map((i) => {
      const qty = i.quantity ?? i.qty ?? 1
      const pid = i.productId ?? i.productid ?? i.id ?? '—'
      const name = getProductName(products, pid)
      return `${name} × ${qty}`
    })
    .join(', ') || '—'
}

function CustomersList({ productsData }) {
  const { data, error, loading } = useRealtime('customers')
  const products = productsData && typeof productsData === 'object' ? productsData : {}

  const list = data && typeof data === 'object'
    ? Object.entries(data)
        .filter(([, c]) => c && typeof c === 'object')
        .map(([uid, c]) => {
          const profile = c.profile && typeof c.profile === 'object' ? c.profile : {}
          const cart = c.cart && typeof c.cart === 'object' ? c.cart : {}
          const orders = c.orders && typeof c.orders === 'object' ? c.orders : {}
          const cartItems = cart.items ?? []
          let totalOrderedCount = 0
          for (const order of Object.values(orders)) {
            const items = order?.items ?? []
            for (const i of items) {
              totalOrderedCount += Number(i.quantity ?? i.qty ?? 1) || 0
            }
          }
          return {
            id: uid,
            name: profile.name ?? '—',
            phone: profile.phone ?? profile.phoneNumber ?? '—',
            email: profile.email ?? '—',
            createdAt: profile.createdAt,
            cartItems,
            totalOrderedCount,
          }
        })
    : []

  return (
    <section className="dashboard-content">
      <h2 className="page-title">Customers</h2>
      {loading && <p className="loading">Loading…</p>}
      {error && <p className="error">Error: {error}</p>}
      {!loading && !error && list.length === 0 && (
        <p className="empty">No customer data in Firebase at path &quot;customers&quot;.</p>
      )}
      {!loading && !error && list.length > 0 && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Created</th>
                <th>Total Ordered Items</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.phone}</td>
                  <td>{row.email}</td>
                  <td>{row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}</td>
                  <td className="items-cell">{row.totalOrderedCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function ProductsList() {
  const { data, error, loading } = useRealtime('products')
  const list = data && typeof data === 'object'
    ? Object.entries(data).map(([id, v]) => ({ id, ...(typeof v === 'object' ? v : { value: v }) }))
    : []

  return (
    <section className="dashboard-content">
      <h2 className="page-title">Products</h2>
      {loading && <p className="loading">Loading…</p>}
      {error && <p className="error">Error: {error}</p>}
      {!loading && !error && list.length === 0 && (
        <p className="empty">No products in Firebase at path &quot;products&quot;.</p>
      )}
      {!loading && !error && list.length > 0 && (
        <div className="table-wrap">
          <table className="data-table products-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Price</th>
                <th>Original Price</th>
                <th>Colors</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => {
                const images = item.images
                const img = Array.isArray(images) && images.length > 0
                  ? images[0]
                  : item.image ?? item.imageUrl ?? item.img ?? item.thumbnail
                const name = item.name ?? item.title ?? '—'
                const price = item.price ?? item.salePrice ?? '—'
                const origPrice = item.originalPrice ?? item.mrp ?? item.compareAtPrice ?? '—'
                const colors = item.colors
                const colorsStr = Array.isArray(colors) ? colors.join(', ') : (colors || '—')
                return (
                  <tr key={item.id}>
                    <td>
                      {img ? (
                        <img src={typeof img === 'string' ? img : img?.url ?? img?.src} alt={name} className="product-thumb" />
                      ) : (
                        <span className="no-img">—</span>
                      )}
                    </td>
                    <td>{name}</td>
                    <td>{typeof price === 'number' ? `₹${price.toLocaleString()}` : price}</td>
                    <td>{typeof origPrice === 'number' ? `₹${origPrice.toLocaleString()}` : origPrice}</td>
                    <td className="items-cell">{colorsStr}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function AdminsList() {
  const { data, error, loading } = useRealtime('admins')
  const list = data && typeof data === 'object'
    ? Object.entries(data).map(([id, v]) => {
        const details = typeof v === 'object' && v !== null ? v : { value: v }
        return { id, ...details }
      })
    : []

  return (
    <section className="dashboard-content">
      <h2 className="page-title">Admin Sign-up Details</h2>
      {loading && <p className="loading">Loading…</p>}
      {error && <p className="error">Error: {error}</p>}
      {!loading && !error && list.length === 0 && (
        <p className="empty">No admin signups yet.</p>
      )}
      {!loading && !error && list.length > 0 && (
        <div className="table-wrap">
          <table className="data-table admins-table">
            <thead>
              <tr>
                <th>UID</th>
                <th>Email</th>
                <th>Name</th>
                <th>Signed up</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row) => (
                <tr key={row.id}>
                  <td><code className="uid-cell">{row.id}</code></td>
                  <td>{row.email || '—'}</td>
                  <td>{row.name || '—'}</td>
                  <td>{row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function formatCheckoutItems(items, products) {
  if (!items || !Array.isArray(items)) return '—'
  return items
    .map((i) => {
      const qty = i.quantity ?? i.qty ?? 1
      const pid = i.productId ?? i.productid ?? i.id ?? '—'
      const name = getProductName(products, pid)
      return `${name} × ${qty}`
    })
    .join(', ') || '—'
}

function flattenOrders(customersData) {
  if (!customersData || typeof customersData !== 'object') return []
  const rows = []
  for (const [customerUid, customer] of Object.entries(customersData)) {
    if (!customer || typeof customer !== 'object') continue
    const orders = customer.orders && typeof customer.orders === 'object' ? customer.orders : {}
    for (const [orderId, order] of Object.entries(orders)) {
      if (!order || typeof order !== 'object') continue
      rows.push({
        id: orderId,
        customerUid,
        ...order,
      })
    }
  }
  return rows.sort((a, b) => {
    const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return tB - tA
  })
}

function CartsList({ productsData }) {
  const { data, error, loading } = useRealtime('customers')
  const products = productsData && typeof productsData === 'object' ? productsData : {}
  const list = flattenOrders(data)

  return (
    <section className="dashboard-content">
      <h2 className="page-title">Orders</h2>
      {loading && <p className="loading">Loading…</p>}
      {error && <p className="error">Error: {error}</p>}
      {!loading && !error && list.length === 0 && (
        <p className="empty">No orders in Firebase under &quot;customers/&#123;uid&#125;/orders&quot;.</p>
      )}
      {!loading && !error && list.length > 0 && (
        <div className="table-wrap table-scroll">
          <table className="data-table orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Street</th>
                <th>City</th>
                <th>State</th>
                <th>Zip</th>
                <th>Country</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Subtotal</th>
                <th>Discount</th>
                <th>Shipping</th>
                <th>Total</th>
                <th>Ordered Items</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row) => {
                const customer = row.customer && typeof row.customer === 'object' ? row.customer : {}
                const shipping = row.shippingAddress && typeof row.shippingAddress === 'object' ? row.shippingAddress : {}
                const items = row.items ?? []
                const firstName = customer.firstName ?? '—'
                const lastName = customer.lastName ?? '—'
                const phone = customer.phone ?? customer.phoneNumber ?? '—'
                const email = customer.email ?? '—'
                const street = shipping.street ?? shipping.streetAddress ?? shipping.address ?? '—'
                const city = shipping.city ?? shipping.town ?? '—'
                const state = shipping.state ?? '—'
                const zip = shipping.zip ?? shipping.zipCode ?? shipping.pincode ?? '—'
                const country = shipping.country ?? '—'
                const payment = row.paymentMethod ?? row.payment ?? '—'
                const status = row.status ?? '—'
                const subtotal = row.subtotal != null ? (typeof row.subtotal === 'number' ? `₹${row.subtotal.toLocaleString()}` : row.subtotal) : '—'
                const discount = row.discount != null ? (typeof row.discount === 'number' ? `₹${row.discount.toLocaleString()}` : row.discount) : '—'
                const shippingCost = row.shipping != null ? (typeof row.shipping === 'number' ? `₹${row.shipping.toLocaleString()}` : row.shipping) : '—'
                const total = row.total != null ? (typeof row.total === 'number' ? `₹${row.total.toLocaleString()}` : row.total) : '—'
                const created = row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'

                return (
                  <tr key={row.id}>
                    <td><code className="uid-cell">{row.id}</code></td>
                    <td>{firstName}</td>
                    <td>{lastName}</td>
                    <td>{phone}</td>
                    <td>{email}</td>
                    <td className="address-cell">{street}</td>
                    <td>{city}</td>
                    <td>{state}</td>
                    <td>{zip}</td>
                    <td>{country}</td>
                    <td>{payment}</td>
                    <td>{status}</td>
                    <td>{subtotal}</td>
                    <td>{discount}</td>
                    <td>{shippingCost}</td>
                    <td>{total}</td>
                    <td className="items-cell">{formatCheckoutItems(items, products)}</td>
                    <td>{created}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default function Dashboard() {
  const [view, setView] = useState('overview')
  const { user } = useAuth()
  const customersData = useRealtime('customers').data
  const productsData = useRealtime('products').data

  const ordersCount = (customersData && typeof customersData === 'object')
    ? Object.values(customersData).reduce((acc, c) => {
        const orders = c?.orders && typeof c.orders === 'object' ? c.orders : {}
        return acc + Object.keys(orders).length
      }, 0)
    : 0

  const handleLogout = () => signOut(auth)
  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'admins', label: 'Admins' },
    { id: 'customers', label: 'Customers' },
    { id: 'products', label: 'Products' },
    { id: 'carts', label: 'Orders' },
  ]

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="avatar">SS</div>
          <h2 className="sidebar-title">Suhatika Dashboard</h2>
        </div>
        <p className="welcome">Welcome back, {user?.email?.split('@')[0] || 'Admin'} 👋</p>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${view === item.id ? 'active' : ''}`}
              onClick={() => setView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="avatar-small">{(user?.email?.[0] || 'A').toUpperCase()}</div>
          <span className="user-label">{user?.email} (Admin)</span>
        </div>
        <button type="button" className="btn-logout-sidebar" onClick={handleLogout}>
          Logout
        </button>
      </aside>
      <main className="main-area">
        <header className="top-bar">
          <h1 className="top-title">Suhatika Sarees Admin</h1>
          <div className="top-actions">
            <span className="logged-in">Logged in: {user?.email?.split('@')[0] || 'Admin'} (Main Admin)</span>
            <button type="button" className="btn-refresh" onClick={() => window.location.reload()}>
              Refresh
            </button>
          </div>
        </header>
        <div className="main-content">
          {view === 'overview' && <Overview customersData={customersData} productsData={productsData} ordersCount={ordersCount} />}
          {view === 'admins' && <AdminsList />}
          {view === 'customers' && <CustomersList productsData={productsData} />}
          {view === 'products' && <ProductsList />}
          {view === 'carts' && <CartsList productsData={productsData} />}
        </div>
      </main>
    </div>
  )
}
