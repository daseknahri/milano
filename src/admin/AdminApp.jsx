/* eslint-disable react-hooks/set-state-in-effect -- Form state intentionally follows refreshed API data. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowLeft,
  BadgeCheck,
  Boxes,
  CarFront,
  Check,
  ChevronRight,
  CircleAlert,
  ExternalLink,
  Eye,
  ImagePlus,
  Instagram,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  Package,
  Pencil,
  Plus,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Store,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import './admin.css'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'categories', label: 'Categories', icon: Boxes },
  { id: 'settings', label: 'Store settings', icon: Settings },
]

const EMPTY_SETTINGS = {
  brandName: '',
  shortName: '',
  announcement: '',
  heroTitle: '',
  heroSubtitle: '',
  heroImage: '',
  phone: '',
  whatsapp: '',
  address: '',
  hours: '',
  instagram: '',
  mapUrl: '',
  aboutTitle: '',
  aboutText: '',
  aboutImage: '',
}

const EMPTY_CATEGORY = { name: '', description: '', image: '' }

const EMPTY_PRODUCT = {
  slug: '',
  name: '',
  category: '',
  brand: '',
  vehicleModels: '',
  years: '',
  price: '',
  priceLabel: '',
  compareAtPrice: '',
  image: '',
  gallery: [],
  description: '',
  features: '',
  badge: '',
  featured: false,
  inStock: true,
}

async function request(path, options = {}) {
  const controller = new AbortController()
  const timeoutMs = options.body instanceof FormData ? 60_000 : options.method && options.method !== 'GET' ? 30_000 : 15_000
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs)
  let response
  try {
    response = await fetch(path, {
      credentials: 'include',
      ...options,
      signal: controller.signal,
      headers: options.body instanceof FormData
        ? options.headers
        : { 'Content-Type': 'application/json', ...options.headers },
    })
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('The request timed out. Check your connection and try again.')
    throw new Error('The server could not be reached. Check your connection and try again.')
  } finally {
    window.clearTimeout(timeout)
  }

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (response.status === 401 && path !== '/api/admin/session' && path !== '/api/admin/login') {
      window.dispatchEvent(new Event('admin:unauthorized'))
    }
    throw new Error(payload.error || payload.message || 'Something went wrong. Please try again.')
  }
  return payload
}

function normalizeContent(payload) {
  const content = payload.content || payload
  return {
    settings: { ...EMPTY_SETTINGS, ...(content.settings || {}) },
    categories: Array.isArray(content.categories) ? content.categories : [],
    products: Array.isArray(content.products) ? content.products : [],
  }
}

function formatPrice(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return '—'
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    maximumFractionDigits: 0,
  }).format(number)
}

function formatProductPrice(product) {
  return product.priceLabel || (Number(product.price) > 0 ? formatPrice(product.price) : 'Sur devis')
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function validateAdminForm(formElement, notify) {
  if (formElement.checkValidity()) return true
  const invalidField = formElement.querySelector(':invalid')
  invalidField?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  window.setTimeout(() => {
    invalidField?.focus({ preventScroll: true })
    invalidField?.reportValidity()
  }, 220)
  notify?.('error', 'Complete the highlighted required fields before saving.')
  return false
}

function listToText(value, separator = '\n') {
  return Array.isArray(value) ? value.join(separator) : value || ''
}

function textToList(value) {
  if (Array.isArray(value)) return value.filter(Boolean)
  return String(value || '')
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function LoginScreen({ onLogin }) {
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await request('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      })
      onLogin()
    } catch (loginError) {
      setError(loginError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="admin-login-shell">
      <section className="login-brand-panel" aria-label="Milan Automobile Accessoires">
        <div className="login-brand-mark">
          <CarFront size={25} strokeWidth={1.7} />
          <span>MA</span>
        </div>
        <div className="login-brand-copy">
          <p className="eyebrow">Store operations</p>
          <h1>Milan Automobile<br />Accessoires</h1>
          <p>Manage the catalogue, storefront story, and customer-facing details from one calm workspace.</p>
        </div>
        <div className="login-panel-footer">
          <ShieldCheck size={18} />
          <span>Protected administration</span>
        </div>
      </section>

      <section className="login-form-panel">
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="mobile-login-brand">
            <div className="login-brand-mark"><CarFront size={20} /><span>MA</span></div>
          </div>
          <p className="eyebrow">Administrator access</p>
          <h2>Welcome back</h2>
          <p className="form-intro">Sign in to update your online showroom.</p>

          {error && <StatusMessage type="error" message={error} />}

          <Field label="Username" required>
            <input
              autoComplete="username"
              autoFocus
              value={credentials.username}
              onChange={(event) => setCredentials({ ...credentials, username: event.target.value })}
              placeholder="Enter your username"
              required
            />
          </Field>
          <Field label="Password" required>
            <input
              type="password"
              autoComplete="current-password"
              value={credentials.password}
              onChange={(event) => setCredentials({ ...credentials, password: event.target.value })}
              placeholder="Enter your password"
              required
            />
          </Field>

          <button className="primary-button login-button" type="submit" disabled={submitting}>
            {submitting ? <LoaderCircle className="spin" size={18} /> : <ArrowLeft className="login-arrow" size={18} />}
            {submitting ? 'Signing in…' : 'Sign in securely'}
          </button>
        </form>
      </section>
    </main>
  )
}

function StatusMessage({ type, message }) {
  const Icon = type === 'success' ? Check : CircleAlert
  return (
    <div className={`status-message ${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <Icon size={16} />
      <span>{message}</span>
    </div>
  )
}

function Field({ label, hint, required, children, wide = false }) {
  return (
    <label className={`admin-field ${wide ? 'field-wide' : ''}`}>
      <span className="field-label">{label}{required && <b aria-hidden="true">*</b>}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  )
}

function UploadField({ label, value, onChange, onStatus, wide = false }) {
  const [uploading, setUploading] = useState(false)

  async function handleUpload(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const form = new FormData()
    form.append('media', file)
    setUploading(true)
    try {
      const result = await request('/api/admin/upload', { method: 'POST', body: form })
      onChange(result.url)
      onStatus?.('success', 'Media uploaded. Save the form to publish it.')
    } catch (uploadError) {
      onStatus?.('error', uploadError.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={`admin-field upload-field ${wide ? 'field-wide' : ''}`}>
      <span className="field-label">{label}</span>
      <div className="upload-control">
        <div className="media-preview">
          {value ? <img src={value} alt="" /> : <ImagePlus size={24} />}
        </div>
        <div className="upload-copy">
          <input
            aria-label={`${label} URL`}
            value={value || ''}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Paste an image URL or upload a file"
          />
          <label className="secondary-button file-button">
            {uploading ? <LoaderCircle className="spin" size={15} /> : <Upload size={15} />}
            {uploading ? 'Uploading…' : 'Upload media'}
            <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
      </div>
    </div>
  )
}

function Sidebar({ activeView, setActiveView, mobileOpen, setMobileOpen, onLogout, brandName }) {
  const sidebarRef = useRef(null)

  useEffect(() => {
    if (!mobileOpen) return undefined
    const previouslyFocused = document.activeElement
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setMobileOpen(false)
      if (event.key !== 'Tab') return
      const focusable = [...(sidebarRef.current?.querySelectorAll('button:not([disabled]), [href]') || [])]
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.body.classList.add('admin-nav-open')
    document.addEventListener('keydown', handleKeyDown)
    sidebarRef.current?.querySelector('button')?.focus()
    return () => {
      document.body.classList.remove('admin-nav-open')
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus?.()
    }
  }, [mobileOpen, setMobileOpen])

  return (
    <>
      <button
        className={`sidebar-scrim ${mobileOpen ? 'is-open' : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-label="Close navigation"
      />
      <aside
        ref={sidebarRef}
        className={`admin-sidebar ${mobileOpen ? 'is-open' : ''}`}
        aria-label="Admin navigation panel"
        aria-modal={mobileOpen ? 'true' : undefined}
        role={mobileOpen ? 'dialog' : undefined}
      >
        <div className="sidebar-brand">
          <div className="sidebar-logo"><CarFront size={21} /></div>
          <div>
            <strong>{brandName || 'Milan Auto'}</strong>
            <span>Administration</span>
          </div>
          <button className="mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="admin-nav" aria-label="Admin navigation">
          <span className="nav-section-label">Workspace</span>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className={activeView === item.id ? 'active' : ''}
                aria-current={activeView === item.id ? 'page' : undefined}
                onClick={() => {
                  setActiveView(item.id)
                  setMobileOpen(false)
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {activeView === item.id && <ChevronRight className="nav-arrow" size={15} />}
              </button>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <a href="/" target="_blank" rel="noreferrer">
            <ExternalLink size={17} />
            View storefront
          </a>
          <button onClick={onLogout}>
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}

function PageHeader({ title, description, onMenu, action }) {
  return (
    <header className="page-header">
      <button className="menu-button" onClick={onMenu} aria-label="Open menu"><Menu size={21} /></button>
      <div>
        <p className="eyebrow">Milan control room</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && <div className="header-action">{action}</div>}
    </header>
  )
}

function Dashboard({ content, setActiveView }) {
  const { products, categories, settings } = content
  const featuredCount = products.filter((product) => product.featured).length
  const outOfStock = products.filter((product) => product.inStock === false).length
  const recent = products.slice(-5).reverse()

  return (
    <div className="view-enter">
      <PageHeader
        title="Store overview"
        description="A quick read on the catalogue currently presented to customers."
      />

      <section className="metrics-row" aria-label="Store summary">
        <Metric icon={Package} label="Products" value={products.length} note={`${featuredCount} featured`} />
        <Metric icon={Boxes} label="Categories" value={categories.length} note="Active collections" />
        <Metric icon={BadgeCheck} label="Availability" value={products.length - outOfStock} note={`${outOfStock} out of stock`} />
        <Metric icon={Store} label="Store status" value={settings.brandName ? 'Ready' : 'Setup'} note="Public catalogue" />
      </section>

      <div className="dashboard-grid">
        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <h2>Latest products</h2>
              <p>The most recently added catalogue entries.</p>
            </div>
            <button className="text-button" onClick={() => setActiveView('products')}>Manage products <ChevronRight size={15} /></button>
          </div>
          {recent.length ? (
            <div className="compact-product-list">
              {recent.map((product) => (
                <div className="compact-product" key={product.id || product.slug}>
                  <div className="compact-thumb">
                    {product.image ? <img src={product.image} alt="" /> : <Package size={18} />}
                  </div>
                  <div className="compact-copy">
                    <strong>{product.name}</strong>
                    <span>{product.brand || product.category || 'Uncategorized'}</span>
                  </div>
                  <span className={`stock-state ${product.inStock === false ? 'out' : ''}`}>
                    {product.inStock === false ? 'Out of stock' : 'In stock'}
                  </span>
                  <b>{formatProductPrice(product)}</b>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Package} title="No products yet" description="Add your first product to start building the catalogue." action="Add product" onAction={() => setActiveView('products')} />
          )}
        </section>

        <aside className="readiness-panel">
          <p className="eyebrow">Store readiness</p>
          <h2>Customer essentials</h2>
          <ReadinessRow done={Boolean(settings.heroImage)} label="Hero photography" />
          <ReadinessRow done={Boolean(settings.whatsapp)} label="WhatsApp contact" />
          <ReadinessRow done={Boolean(settings.address)} label="Store address" />
          <ReadinessRow done={Boolean(settings.instagram)} label="Instagram profile" />
          <button className="secondary-button" onClick={() => setActiveView('settings')}>
            <Settings size={16} /> Review settings
          </button>
        </aside>
      </div>
    </div>
  )
}

function Metric({ icon: Icon, label, value, note }) {
  return (
    <div className="metric">
      <Icon size={18} />
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  )
}

function ReadinessRow({ done, label }) {
  return (
    <div className="readiness-row">
      <span className={done ? 'done' : ''}>{done ? <Check size={13} /> : null}</span>
      <p>{label}</p>
      <b>{done ? 'Complete' : 'Needs attention'}</b>
    </div>
  )
}

function SettingsView({ settings, onSaved, notify }) {
  const [form, setForm] = useState(settings)
  const [saving, setSaving] = useState(false)

  useEffect(() => setForm(settings), [settings])

  function change(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validateAdminForm(event.currentTarget, notify)) return
    setSaving(true)
    try {
      const result = await request('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(form),
      })
      onSaved(result.settings || result)
      notify('success', 'Store settings saved and ready for the storefront.')
    } catch (saveError) {
      notify('error', saveError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="view-enter settings-form" onSubmit={handleSubmit} noValidate aria-busy={saving}>
      <PageHeader
        title="Store settings"
        description="Manage the identity, story, and contact information shown across the storefront."
        action={<button className="primary-button" type="submit" disabled={saving}>{saving ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />}{saving ? 'Saving…' : 'Save changes'}</button>}
      />

      <FormSection title="Brand identity" description="The names and announcement customers see first.">
        <Field label="Brand name" required><input value={form.brandName} onChange={(e) => change('brandName', e.target.value)} required /></Field>
        <Field label="Short name" hint="Used where space is limited."><input value={form.shortName} onChange={(e) => change('shortName', e.target.value)} /></Field>
        <Field label="Announcement" wide><input value={form.announcement} onChange={(e) => change('announcement', e.target.value)} placeholder="Free delivery in Casablanca…" /></Field>
      </FormSection>

      <FormSection title="Homepage hero" description="Keep the headline concise and pair it with a strong automotive image.">
        <Field label="Hero title" required wide><input value={form.heroTitle} onChange={(e) => change('heroTitle', e.target.value)} required /></Field>
        <Field label="Hero subtitle" wide><textarea rows="3" value={form.heroSubtitle} onChange={(e) => change('heroSubtitle', e.target.value)} /></Field>
        <UploadField label="Hero image" value={form.heroImage} onChange={(value) => change('heroImage', value)} onStatus={notify} wide />
      </FormSection>

      <FormSection title="Contact & location" description="Give customers a direct route to the store and your team.">
        <Field label="Phone"><input value={form.phone} onChange={(e) => change('phone', e.target.value)} placeholder="+212 …" /></Field>
        <Field label="WhatsApp"><input value={form.whatsapp} onChange={(e) => change('whatsapp', e.target.value)} placeholder="+212 …" /></Field>
        <Field label="Address" wide><input value={form.address} onChange={(e) => change('address', e.target.value)} /></Field>
        <Field label="Opening hours"><input value={form.hours} onChange={(e) => change('hours', e.target.value)} placeholder="Mon–Sat, 09:00–19:00" /></Field>
        <Field label="Google Maps URL"><input type="url" value={form.mapUrl} onChange={(e) => change('mapUrl', e.target.value)} /></Field>
      </FormSection>

      <FormSection title="Social presence" description="Connect the catalogue to the social profile customers already know.">
        <Field label="Instagram URL" wide>
          <div className="input-with-icon"><Instagram size={17} /><input type="url" value={form.instagram} onChange={(e) => change('instagram', e.target.value)} /></div>
        </Field>
      </FormSection>

      <FormSection title="About the store" description="A short, credible introduction to the business.">
        <Field label="Section title" wide><input value={form.aboutTitle} onChange={(e) => change('aboutTitle', e.target.value)} /></Field>
        <Field label="Story" wide><textarea rows="6" value={form.aboutText} onChange={(e) => change('aboutText', e.target.value)} /></Field>
        <UploadField label="About image" value={form.aboutImage} onChange={(value) => change('aboutImage', value)} onStatus={notify} wide />
      </FormSection>

      <div className="mobile-save-bar">
        <button className="primary-button" type="submit" disabled={saving}><Save size={17} />{saving ? 'Saving…' : 'Save changes'}</button>
      </div>
    </form>
  )
}

function FormSection({ title, description, children }) {
  return (
    <section className="form-section">
      <div className="form-section-heading">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="form-grid">{children}</div>
    </section>
  )
}

function CategoriesView({ categories, setCategories, notify }) {
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  async function saveCategory(values) {
    const isEdit = Boolean(editing?.id)
    const path = isEdit ? `/api/admin/categories/${editing.id}` : '/api/admin/categories'
    const result = await request(path, {
      method: isEdit ? 'PUT' : 'POST',
      body: JSON.stringify(values),
    })
    const saved = result.category || result
    setCategories((current) => isEdit
      ? current.map((item) => item.id === editing.id ? saved : item)
      : [...current, saved])
    notify('success', `Category ${isEdit ? 'updated' : 'created'} successfully.`)
    setEditing(null)
  }

  async function deleteCategory() {
    try {
      await request(`/api/admin/categories/${deleting.id}`, { method: 'DELETE' })
      setCategories((current) => current.filter((item) => item.id !== deleting.id))
      notify('success', 'Category removed from the catalogue.')
      setDeleting(null)
    } catch (deleteError) {
      notify('error', deleteError.message)
    }
  }

  return (
    <div className="view-enter">
      <PageHeader
        title="Categories"
        description="Organize products into clear collections customers can browse."
        action={<button className="primary-button" onClick={() => setEditing({ ...EMPTY_CATEGORY })}><Plus size={17} />New category</button>}
      />

      {categories.length ? (
        <div className="category-list">
          {categories.map((category) => (
            <article className="category-row" key={category.id}>
              <div className="category-image">
                {category.image ? <img src={category.image} alt="" /> : <Boxes size={23} />}
              </div>
              <div className="category-copy">
                <h2>{category.name}</h2>
                <p>{category.description || 'No description has been added.'}</p>
              </div>
              <div className="row-actions">
                <button onClick={() => setEditing(category)} aria-label={`Edit ${category.name}`}><Pencil size={16} /></button>
                <button className="danger-icon" onClick={() => setDeleting(category)} aria-label={`Delete ${category.name}`}><Trash2 size={16} /></button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState icon={Boxes} title="Create your first category" description="Categories keep the catalogue easy to browse and maintain." action="New category" onAction={() => setEditing({ ...EMPTY_CATEGORY })} />
      )}

      {editing && (
        <CategoryEditor
          category={editing}
          onClose={() => setEditing(null)}
          onSave={saveCategory}
          notify={notify}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete this category?"
          description={`“${deleting.name}” can only be removed after its products have been reassigned to another category.`}
          onCancel={() => setDeleting(null)}
          onConfirm={deleteCategory}
        />
      )}
    </div>
  )
}

function CategoryEditor({ category, onClose, onSave, notify }) {
  const [form, setForm] = useState({ ...EMPTY_CATEGORY, ...category })
  const [saving, setSaving] = useState(false)

  async function submit(event) {
    event.preventDefault()
    if (!validateAdminForm(event.currentTarget, notify)) return
    setSaving(true)
    try {
      await onSave({ name: form.name.trim(), description: form.description.trim(), image: form.image })
    } catch (saveError) {
      notify('error', saveError.message)
      setSaving(false)
    }
  }

  return (
    <EditorDrawer title={category.id ? 'Edit category' : 'New category'} onClose={onClose} busy={saving}>
      <form className="drawer-form" onSubmit={submit} noValidate aria-busy={saving}>
        <div className="drawer-form-body">
          <Field label="Category name" required><input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label="Description"><textarea rows="5" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <UploadField label="Category image" value={form.image} onChange={(value) => setForm({ ...form, image: value })} onStatus={notify} />
        </div>
        <div className="drawer-actions">
          <button className="secondary-button" type="button" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="primary-button" type="submit" disabled={saving}><Save size={16} />{saving ? 'Saving…' : 'Save category'}</button>
        </div>
      </form>
    </EditorDrawer>
  )
}

function ProductsView({ products, setProducts, categories, notify }) {
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')

  const categoryNames = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  )

  const filtered = useMemo(() => products.filter((product) => {
    const matchesQuery = `${product.name} ${product.brand} ${product.category}`.toLowerCase().includes(query.toLowerCase())
    const matchesFilter = filter === 'all'
      || (filter === 'featured' && product.featured)
      || (filter === 'stock' && product.inStock !== false)
      || (filter === 'out' && product.inStock === false)
    return matchesQuery && matchesFilter
  }), [products, query, filter])

  async function saveProduct(values) {
    const isEdit = Boolean(editing?.id)
    const path = isEdit ? `/api/admin/products/${editing.id}` : '/api/admin/products'
    const result = await request(path, {
      method: isEdit ? 'PUT' : 'POST',
      body: JSON.stringify(values),
    })
    const saved = result.product || result
    setProducts((current) => isEdit
      ? current.map((item) => item.id === editing.id ? saved : item)
      : [...current, saved])
    notify('success', `Product ${isEdit ? 'updated' : 'added'} successfully.`)
    setEditing(null)
  }

  async function deleteProduct() {
    try {
      await request(`/api/admin/products/${deleting.id}`, { method: 'DELETE' })
      setProducts((current) => current.filter((item) => item.id !== deleting.id))
      notify('success', 'Product removed from the catalogue.')
      setDeleting(null)
    } catch (deleteError) {
      notify('error', deleteError.message)
    }
  }

  return (
    <div className="view-enter">
      <PageHeader
        title="Products"
        description="Maintain the products, fitment details, pricing, and imagery customers rely on."
        action={<button className="primary-button" onClick={() => setEditing({ ...EMPTY_PRODUCT })}><Plus size={17} />Add product</button>}
      />

      <div className="catalog-toolbar">
        <div className="search-box"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products, brands, categories…" /></div>
        <div className="filter-tabs">
          {[['all', 'All'], ['featured', 'Featured'], ['stock', 'In stock'], ['out', 'Out of stock']].map(([value, label]) => (
            <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{label}</button>
          ))}
        </div>
      </div>

      {filtered.length ? (
        <div className="product-table-wrap">
          <table className="product-table">
            <thead>
              <tr><th>Product</th><th>Category</th><th>Price</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.id || product.slug}>
                  <td>
                    <div className="table-product">
                      <div className="table-thumb">{product.image ? <img src={product.image} alt="" /> : <Package size={20} />}</div>
                      <div><strong>{product.name}</strong><span>{product.brand || 'No brand'} · {product.slug}</span></div>
                    </div>
                  </td>
                  <td>{categoryNames.get(product.categoryId || product.category) || product.category || 'Uncategorized'}</td>
                  <td><strong>{formatProductPrice(product)}</strong>{Number(product.compareAtPrice) > 0 && <del>{formatPrice(product.compareAtPrice)}</del>}</td>
                  <td><span className={`stock-state ${product.inStock === false ? 'out' : ''}`}>{product.inStock === false ? 'Out of stock' : 'In stock'}</span></td>
                  <td>
                    <div className="row-actions">
                      <button onClick={() => setEditing(product)} aria-label={`Edit ${product.name}`}><Pencil size={16} /></button>
                      <button className="danger-icon" onClick={() => setDeleting(product)} aria-label={`Delete ${product.name}`}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={query || filter !== 'all' ? Search : Package}
          title={query || filter !== 'all' ? 'No matching products' : 'Add your first product'}
          description={query || filter !== 'all' ? 'Try a different search or availability filter.' : 'Build the catalogue with clear details and strong imagery.'}
          action={query || filter !== 'all' ? 'Clear filters' : 'Add product'}
          onAction={() => {
            if (query || filter !== 'all') { setQuery(''); setFilter('all') } else setEditing({ ...EMPTY_PRODUCT })
          }}
        />
      )}

      {editing && (
        <ProductEditor product={editing} categories={categories} onClose={() => setEditing(null)} onSave={saveProduct} notify={notify} />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete this product?"
          description={`“${deleting.name}” will be permanently removed from the catalogue.`}
          onCancel={() => setDeleting(null)}
          onConfirm={deleteProduct}
        />
      )}
    </div>
  )
}

function ProductEditor({ product, categories, onClose, onSave, notify }) {
  const [form, setForm] = useState({
    ...EMPTY_PRODUCT,
    ...product,
    category: product.categoryId || product.category || '',
    vehicleModels: listToText(product.vehicleModels, ', '),
    features: listToText(product.features),
    gallery: Array.isArray(product.gallery) ? product.gallery : [],
  })
  const [saving, setSaving] = useState(false)
  const [galleryUrl, setGalleryUrl] = useState('')
  const [galleryUploading, setGalleryUploading] = useState(false)

  function change(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function handleNameChange(value) {
    setForm((current) => ({
      ...current,
      name: value,
      slug: product.id || current.slug ? current.slug : slugify(value),
    }))
  }

  function addGalleryUrl(url = galleryUrl) {
    const clean = url.trim()
    if (!clean || form.gallery.includes(clean)) return
    change('gallery', [...form.gallery, clean])
    setGalleryUrl('')
  }

  async function uploadGallery(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const data = new FormData()
    data.append('media', file)
    setGalleryUploading(true)
    try {
      const result = await request('/api/admin/upload', { method: 'POST', body: data })
      addGalleryUrl(result.url)
      notify('success', 'Gallery image uploaded. Save the product to publish it.')
    } catch (uploadError) {
      notify('error', uploadError.message)
    } finally {
      setGalleryUploading(false)
    }
  }

  async function submit(event) {
    event.preventDefault()
    if (!validateAdminForm(event.currentTarget, notify)) return
    setSaving(true)
    try {
      await onSave({
        ...form,
        price: Number(form.price),
        compareAtPrice: form.compareAtPrice === '' ? '' : Number(form.compareAtPrice),
        vehicleModels: textToList(form.vehicleModels),
        years: form.years.trim(),
        features: textToList(form.features),
      })
    } catch (saveError) {
      notify('error', saveError.message)
      setSaving(false)
    }
  }

  return (
    <EditorDrawer title={product.id ? 'Edit product' : 'Add product'} wide onClose={onClose} busy={saving || galleryUploading}>
      <form className="drawer-form product-form" onSubmit={submit} noValidate aria-busy={saving}>
        <div className="drawer-form-body form-grid">
          <Field label="Product name" required wide><input autoFocus value={form.name} onChange={(e) => handleNameChange(e.target.value)} required /></Field>
          <Field label="URL slug" required><input value={form.slug} onChange={(e) => change('slug', slugify(e.target.value))} required /></Field>
          <Field label="Brand"><input value={form.brand} onChange={(e) => change('brand', e.target.value)} /></Field>
          <Field label="Category" required>
            <select value={form.category} onChange={(e) => change('category', e.target.value)} required>
              <option value="">Select category</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </Field>
          <Field label="Badge"><input value={form.badge} onChange={(e) => change('badge', e.target.value)} placeholder="New, Bestseller…" /></Field>
          <Field label="Price (MAD)" required><input type="number" min="0" step="0.01" value={form.price} onChange={(e) => change('price', e.target.value)} required /></Field>
          <Field label="Price label" hint="Optional text such as “Sur devis”."><input value={form.priceLabel} onChange={(e) => change('priceLabel', e.target.value)} /></Field>
          <Field label="Compare-at price (MAD)"><input type="number" min="0" step="0.01" value={form.compareAtPrice} onChange={(e) => change('compareAtPrice', e.target.value)} /></Field>
          <Field label="Compatible vehicles" hint="Separate models with commas."><input value={form.vehicleModels} onChange={(e) => change('vehicleModels', e.target.value)} placeholder="Dacia Duster, Renault Clio…" /></Field>
          <Field label="Compatible years"><input value={form.years} onChange={(e) => change('years', e.target.value)} placeholder="2018–2025" /></Field>
          <Field label="Description" wide><textarea rows="5" value={form.description} onChange={(e) => change('description', e.target.value)} /></Field>
          <Field label="Features" hint="One per line for clean storefront bullets." wide><textarea rows="5" value={form.features} onChange={(e) => change('features', e.target.value)} /></Field>
          <UploadField label="Main image" value={form.image} onChange={(value) => change('image', value)} onStatus={notify} wide />
          <div className="admin-field field-wide">
            <span className="field-label">Gallery</span>
            <div className="gallery-grid">
              {form.gallery.map((url) => (
                <div className="gallery-item" key={url}>
                  <img src={url} alt="" />
                  <button type="button" onClick={() => change('gallery', form.gallery.filter((item) => item !== url))} aria-label="Remove image"><X size={14} /></button>
                </div>
              ))}
              <label className="gallery-upload">
                {galleryUploading ? <LoaderCircle className="spin" size={19} /> : <ImagePlus size={20} />}
                <span>{galleryUploading ? 'Uploading…' : 'Upload'}</span>
                <input type="file" accept="image/*" onChange={uploadGallery} disabled={galleryUploading} />
              </label>
            </div>
            <div className="inline-add">
              <input value={galleryUrl} onChange={(e) => setGalleryUrl(e.target.value)} placeholder="Or paste another image URL" />
              <button className="secondary-button" type="button" onClick={() => addGalleryUrl()}>Add URL</button>
            </div>
          </div>
          <div className="toggle-row field-wide">
            <Toggle checked={form.featured} onChange={(value) => change('featured', value)} label="Featured product" description="Show this item in curated homepage areas." />
            <Toggle checked={form.inStock} onChange={(value) => change('inStock', value)} label="In stock" description="Allow customers to see this as currently available." />
          </div>
        </div>
        <div className="drawer-actions">
          <button className="secondary-button" type="button" onClick={onClose} disabled={saving || galleryUploading}>Cancel</button>
          <button className="primary-button" type="submit" disabled={saving}><Save size={16} />{saving ? 'Saving…' : 'Save product'}</button>
        </div>
      </form>
    </EditorDrawer>
  )
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="toggle-control">
      <button type="button" role="switch" aria-checked={checked} className={checked ? 'checked' : ''} onClick={() => onChange(!checked)}>
        <span />
      </button>
      <span><strong>{label}</strong><small>{description}</small></span>
    </label>
  )
}

function EditorDrawer({ title, children, onClose, wide = false, busy = false }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement
    const handleDialogKeys = (event) => {
      if (event.key === 'Escape' && !busy) onClose()
      if (event.key !== 'Tab') return
      const focusable = [...(dialogRef.current?.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ) || [])].filter((element) => element.getClientRects().length)
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleDialogKeys)
    document.body.classList.add('drawer-open')
    return () => {
      document.removeEventListener('keydown', handleDialogKeys)
      document.body.classList.remove('drawer-open')
      previouslyFocused?.focus?.()
    }
  }, [onClose, busy])

  return createPortal(
    <div ref={dialogRef} className="dialog-layer" role="dialog" aria-modal="true" aria-label={title}>
      <button className="dialog-scrim" aria-label="Close editor" onClick={onClose} disabled={busy} />
      <aside className={`editor-drawer ${wide ? 'wide' : ''}`}>
        <header><div><p className="eyebrow">Catalogue editor</p><h2>{title}</h2></div><button onClick={onClose} aria-label="Close" disabled={busy}><X size={20} /></button></header>
        <div className="drawer-content">{children}</div>
      </aside>
    </div>,
    document.body,
  )
}

function ConfirmDialog({ title, description, onCancel, onConfirm }) {
  const [working, setWorking] = useState(false)
  const cancelButtonRef = useRef(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement
    cancelButtonRef.current?.focus()
    const handleEscape = (event) => {
      if (event.key === 'Escape' && !working) onCancel()
    }
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
      previouslyFocused?.focus?.()
    }
  }, [onCancel, working])

  async function confirm() {
    setWorking(true)
    await onConfirm()
    setWorking(false)
  }

  return createPortal(
    <div className="dialog-layer confirm-layer" role="alertdialog" aria-modal="true" aria-label={title}>
      <button className="dialog-scrim" aria-label="Cancel" onClick={onCancel} />
      <div className="confirm-dialog">
        <div className="confirm-icon"><Trash2 size={21} /></div>
        <h2>{title}</h2>
        <p>{description}</p>
        <div>
          <button ref={cancelButtonRef} className="secondary-button" onClick={onCancel}>Cancel</button>
          <button className="danger-button" onClick={confirm} disabled={working}>{working ? <LoaderCircle className="spin" size={16} /> : <Trash2 size={16} />}{working ? 'Deleting…' : 'Delete'}</button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function EmptyState({ icon: Icon, title, description, action, onAction }) {
  return (
    <div className="empty-state">
      <Icon size={25} />
      <h2>{title}</h2>
      <p>{description}</p>
      <button className="secondary-button" onClick={onAction}>{action}</button>
    </div>
  )
}

export default function AdminApp() {
  const [session, setSession] = useState('checking')
  const [content, setContent] = useState({ settings: EMPTY_SETTINGS, categories: [], products: [] })
  const [loadingContent, setLoadingContent] = useState(false)
  const [contentError, setContentError] = useState('')
  const [activeView, setActiveView] = useState('dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    let robots = document.head.querySelector('meta[name="robots"]')
    const created = !robots
    if (!robots) {
      robots = document.createElement('meta')
      robots.setAttribute('name', 'robots')
      document.head.appendChild(robots)
    }
    const previous = robots.getAttribute('content') || 'index, follow'
    robots.setAttribute('content', 'noindex, nofollow')
    document.title = 'Administration — Milan Automobile Accessoires'
    return () => {
      if (created) robots.remove()
      else robots.setAttribute('content', previous)
    }
  }, [])

  const loadContent = useCallback(async () => {
    setLoadingContent(true)
    setContentError('')
    try {
      const result = await request('/api/admin/content')
      setContent(normalizeContent(result))
    } catch (loadError) {
      if (/unauth|session|sign in/i.test(loadError.message)) setSession('anonymous')
      else setContentError(loadError.message)
    } finally {
      setLoadingContent(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    request('/api/admin/session')
      .then((result) => {
        if (!active) return
        const authenticated = result.authenticated ?? result.loggedIn ?? result.session?.authenticated ?? Boolean(result.user)
        setSession(authenticated ? 'authenticated' : 'anonymous')
      })
      .catch(() => active && setSession('anonymous'))
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (session === 'authenticated') loadContent()
  }, [session, loadContent])

  useEffect(() => {
    const handleUnauthorized = () => {
      setSession('anonymous')
      setContent({ settings: EMPTY_SETTINGS, categories: [], products: [] })
    }
    window.addEventListener('admin:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('admin:unauthorized', handleUnauthorized)
  }, [])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(null), 4500)
    return () => window.clearTimeout(timer)
  }, [toast])

  function notify(type, message) {
    setToast({ type, message, id: Date.now() })
  }

  async function logout() {
    try {
      await request('/api/admin/logout', { method: 'POST' })
    } finally {
      setSession('anonymous')
      setContent({ settings: EMPTY_SETTINGS, categories: [], products: [] })
    }
  }

  if (session === 'checking') {
    return <div className="admin-boot"><div className="sidebar-logo"><CarFront size={23} /></div><LoaderCircle className="spin" size={22} /><span>Opening the control room…</span></div>
  }

  if (session === 'anonymous') {
    return <LoginScreen onLogin={() => setSession('authenticated')} />
  }

  const views = {
    dashboard: <Dashboard content={content} setActiveView={setActiveView} />,
    settings: <SettingsView settings={content.settings} onSaved={(settings) => setContent((current) => ({ ...current, settings: { ...current.settings, ...settings } }))} notify={notify} />,
    categories: <CategoriesView categories={content.categories} setCategories={(updater) => setContent((current) => ({ ...current, categories: typeof updater === 'function' ? updater(current.categories) : updater }))} notify={notify} />,
    products: <ProductsView products={content.products} setProducts={(updater) => setContent((current) => ({ ...current, products: typeof updater === 'function' ? updater(current.products) : updater }))} categories={content.categories} notify={notify} />,
  }

  return (
    <div className="admin-app">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onLogout={logout}
        brandName={content.settings.shortName || content.settings.brandName}
      />
      <main className="admin-main">
        {loadingContent ? (
          <div className="content-loading"><LoaderCircle className="spin" size={22} />Loading store content…</div>
        ) : contentError ? (
          <div className="load-error">
            <CircleAlert size={28} />
            <h1>We couldn’t load the store</h1>
            <p>{contentError}</p>
            <button className="primary-button" onClick={loadContent}>Try again</button>
          </div>
        ) : (
          <div className="admin-page">
            <div className="mobile-topbar">
              <button onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={21} /></button>
              <strong>{content.settings.shortName || 'Milan Auto'}</strong>
              <a href="/" target="_blank" rel="noreferrer" aria-label="View storefront"><Eye size={19} /></a>
            </div>
            {views[activeView]}
          </div>
        )}
      </main>
      {toast && (
        <div className={`toast ${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'} aria-live={toast.type === 'error' ? 'assertive' : 'polite'} key={toast.id}>
          {toast.type === 'success' ? <Check size={17} /> : <CircleAlert size={17} />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} aria-label="Dismiss"><X size={15} /></button>
        </div>
      )}
    </div>
  )
}
