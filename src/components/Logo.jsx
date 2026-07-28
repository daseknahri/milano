export default function Logo({ light = false }) {
  return (
    <span className={`logo ${light ? 'logo--light' : ''}`} aria-label="Milan Automobile Accessoires">
      <span className="logo__mark" aria-hidden="true">
        <i />
        <i />
      </span>
      <span>
        <strong>MILAN</strong>
        <small>AUTOMOBILE ACCESSOIRES</small>
      </span>
    </span>
  )
}

