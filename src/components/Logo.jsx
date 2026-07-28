export default function Logo({ light = false }) {
  return (
    <span className={`logo ${light ? 'logo--light' : ''}`} aria-label="Milan Automobile Accessoires">
      <img className="logo__mark" src="/assets/logo-mark.png" alt="" aria-hidden="true" />
      <span>
        <strong>MILAN</strong>
        <small>AUTOMOBILE ACCESSOIRES</small>
      </span>
    </span>
  )
}

