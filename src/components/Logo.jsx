export default function Logo({ light = false, src = '' }) {
  return (
    <span className={`logo ${light ? 'logo--light' : ''}`} aria-label="Milan Automobile Accessoires">
      <img
        className="logo__mark"
        src={src || '/assets/logo-mark.png'}
        alt=""
        aria-hidden="true"
        onError={(event) => {
          event.currentTarget.onerror = null
          event.currentTarget.src = '/assets/logo-mark.png'
        }}
      />
      <span>
        <strong>MILAN</strong>
        <small>AUTOMOBILE ACCESSOIRES</small>
      </span>
    </span>
  )
}

