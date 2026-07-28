import { lazy, Suspense, useEffect, useRef } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import CartDrawer from './components/CartDrawer'
import Footer from './components/Footer'
import Header from './components/Header'
import PageLoader from './components/PageLoader'
import { StoreProvider } from './context/StoreContext'
import Catalog from './pages/Catalog'
import Contact from './pages/Contact'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import ProductDetail from './pages/ProductDetail'
import Workshop from './pages/Workshop'

const AdminApp = lazy(() => import('./admin/AdminApp'))

function RouteReset() {
  const { pathname } = useLocation()
  const previousPath = useRef(pathname)
  useEffect(() => {
    window.scrollTo(0, 0)
    if (previousPath.current !== pathname) {
      window.requestAnimationFrame(() => {
        const heading = document.querySelector('#main-content h1')
        if (heading) {
          heading.setAttribute('tabindex', '-1')
          heading.focus({ preventScroll: true })
        }
      })
      previousPath.current = pathname
    }
  }, [pathname])
  return null
}

function SiteRoutes() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  if (isAdmin) {
    return (
      <Suspense fallback={<PageLoader />}>
        <AdminApp />
      </Suspense>
    )
  }

  return (
    <>
      <RouteReset />
      <a className="skip-link" href="#main-content">Aller au contenu</a>
      <Header />
      <div id="main-content" tabIndex="-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogue" element={<Catalog />} />
          <Route path="/produit/:slug" element={<ProductDetail />} />
          <Route path="/atelier" element={<Workshop />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <Footer />
      <CartDrawer />
    </>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <SiteRoutes />
    </StoreProvider>
  )
}

