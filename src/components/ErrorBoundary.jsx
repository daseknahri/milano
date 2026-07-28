import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error, details) {
    console.error('Milan storefront render failure', error, details)
  }

  resetCart = () => {
    try {
      localStorage.removeItem('milan-cart')
    } finally {
      window.location.reload()
    }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main className="fatal-error" role="alert">
        <span>MI</span>
        <p className="eyebrow">Un problème inattendu est survenu</p>
        <h1>La page n’a pas pu s’afficher.</h1>
        <p>Rechargez la page pour continuer. Si le problème persiste, réinitialisez uniquement votre sélection.</p>
        <div className="fatal-error__actions">
          <button className="button button--accent" onClick={() => window.location.reload()}>Recharger la page</button>
          <button className="button button--outline" onClick={this.resetCart}>Réinitialiser ma sélection</button>
        </div>
      </main>
    )
  }
}
