function Icon({ name, size = 20 }) {
  const paths = {
    plus: <path d="M12 5v14M5 12h14" />,
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
    sparkles: <><path d="m12 3-1.1 5.2L6 9.5l4.9 1.3L12 16l1.1-5.2L18 9.5l-4.9-1.3L12 3Z" /><path d="m19 16-.5 2.5L16 19l2.5.5L19 22l.5-2.5L22 19l-2.5-.5L19 16Z" /></>,
    send: <path d="m21 3-7.2 18-3.5-7.3L3 10.2 21 3Z" />,
    stop: <rect x="7" y="7" width="10" height="10" rx="1" fill="currentColor" stroke="none" />,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" /><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M8 7h8M8 11h6" /></>,
    panel: <><path d="M3 4h18v16H3z" /><path d="M9 4v16M5.5 8h1M5.5 12h1" /></>,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  )
}

export default Icon
