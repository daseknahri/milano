import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useSeo } from '../hooks/useSeo'

export default function NotFound({ compact = false }) {
  useSeo('Page introuvable', 'Cette page est introuvable.')
  return (
    <main className={`not-found ${compact ? 'not-found--compact' : ''}`}>
      <span>404</span>
      <h1>Cette route ne mène nulle part.</h1>
      <p>Revenez à la collection pour trouver votre prochain équipement.</p>
      <Link className="button button--dark" to="/"><ArrowLeft size={18} /> Retour à l’accueil</Link>
    </main>
  )
}

