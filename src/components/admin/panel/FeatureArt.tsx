/**
 * As três ilustrações dos blocos — copiadas do ficheiro aprovado.
 *
 * Os identificadores dos gradientes foram prefixados porque, ao contrário de
 * uma página solta, aqui podem coexistir várias instâncias no mesmo documento
 * e `id` repetido faz o navegador usar o primeiro que encontrar.
 */

export function CoinsArt() {
  return (
    <svg className="feature-art" viewBox="0 0 160 160" aria-hidden="true">
      <defs>
        <linearGradient id="adm-coin-side" x1="0" y1="0" x2="1" y2=".4"><stop stopColor="#6698f9"/><stop offset=".48" stopColor="#b7d7ff"/><stop offset="1" stopColor="#6593fa"/></linearGradient>
        <linearGradient id="adm-coin-top" x1="0" y1="1" x2="1" y2="0"><stop stopColor="#96bbff"/><stop offset="1" stopColor="#d3e6ff"/></linearGradient>
        <linearGradient id="adm-coin-mid" x1="0" y1="1" x2="1" y2="0"><stop stopColor="#4876df"/><stop offset="1" stopColor="#9cbdff"/></linearGradient>
        <filter id="adm-coin-shadow"><feGaussianBlur stdDeviation="5"/></filter>
      </defs>
      <ellipse cx="89" cy="133" rx="45" ry="9" fill="#0d3a9f" opacity=".3" filter="url(#adm-coin-shadow)"/>
      <g transform="rotate(-8 85 85)">
        <path d="M38 107v13c0 12 21 21 47 21s47-9 47-21v-13" fill="url(#adm-coin-side)"/>
        <ellipse cx="85" cy="107" rx="47" ry="20" fill="url(#adm-coin-mid)" stroke="#bbd6ff" strokeOpacity=".55" strokeWidth=".7"/>
        <path d="M34 81v13c0 12 21 21 47 21s47-9 47-21V81" fill="url(#adm-coin-side)"/>
        <ellipse cx="81" cy="81" rx="47" ry="20" fill="url(#adm-coin-mid)" stroke="#cce0ff" strokeOpacity=".7" strokeWidth=".7"/>
        <path d="M38 55v13c0 12 21 21 47 21s47-9 47-21V55" fill="url(#adm-coin-side)"/>
        <ellipse cx="85" cy="55" rx="47" ry="20" fill="url(#adm-coin-top)" stroke="#e5efff" strokeOpacity=".9" strokeWidth=".7"/>
        <ellipse cx="85" cy="54" rx="36" ry="13" fill="none" stroke="#dfedff" strokeOpacity=".4" strokeWidth=".6"/>
      </g>
    </svg>
  );
}

export function LayersArt() {
  return (
    <svg className="feature-art" viewBox="0 0 160 160" aria-hidden="true">
      <defs>
        <linearGradient id="adm-layer-green" x1="0" y1="1" x2="1" y2="0"><stop stopColor="#29bc9a"/><stop offset="1" stopColor="#9ef0d3"/></linearGradient>
        <linearGradient id="adm-layer-top" x1="0" y1="1" x2="1" y2="0"><stop stopColor="#80dfbd"/><stop offset="1" stopColor="#ddffeb"/></linearGradient>
        <linearGradient id="adm-layer-edge" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#24a582"/><stop offset="1" stopColor="#70d9ad"/></linearGradient>
        <filter id="adm-layer-shadow"><feGaussianBlur stdDeviation="5"/></filter>
      </defs>
      <ellipse cx="87" cy="138" rx="42" ry="7" fill="#034a39" opacity=".4" filter="url(#adm-layer-shadow)"/>
      <path d="m39 103 42-23a9 9 0 0 1 9 0l43 23v7L91 135a10 10 0 0 1-11 0l-41-25z" fill="url(#adm-layer-edge)"/>
      <path d="m39 99 41-24a10 10 0 0 1 11 0l42 24q6 4 0 8l-42 24a11 11 0 0 1-11 0l-41-24q-6-4 0-8" fill="url(#adm-layer-green)" stroke="#b1efcd" strokeWidth=".6"/>
      <path d="m35 79 42-23a9 9 0 0 1 9 0l43 23v7l-42 25a10 10 0 0 1-11 0L35 86z" fill="url(#adm-layer-edge)"/>
      <path d="m35 75 41-24a10 10 0 0 1 11 0l42 24q6 4 0 8l-42 24a11 11 0 0 1-11 0L35 83q-6-4 0-8" fill="url(#adm-layer-green)" stroke="#b1efcd" strokeWidth=".6"/>
      <path d="m39 53 42-23a9 9 0 0 1 9 0l43 23v7L91 85a10 10 0 0 1-11 0L39 60z" fill="url(#adm-layer-edge)"/>
      <path d="m39 49 41-24a10 10 0 0 1 11 0l42 24q6 4 0 8L91 81a11 11 0 0 1-11 0L39 57q-6-4 0-8" fill="url(#adm-layer-top)" stroke="#dcffe8" strokeWidth=".8"/>
    </svg>
  );
}

export function RingArt() {
  return (
    <svg className="feature-art" viewBox="0 0 160 160" aria-hidden="true">
      <defs>
        <linearGradient id="adm-ring-yellow" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff0bd"/><stop offset=".5" stopColor="#f7da89"/><stop offset="1" stopColor="#d1a140"/></linearGradient>
        <linearGradient id="adm-ring-back" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#c68e28"/><stop offset="1" stopColor="#e7b855"/></linearGradient>
        <linearGradient id="adm-ring-shine" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff9d9"/><stop offset="1" stopColor="#e5b64b"/></linearGradient>
        <filter id="adm-ring-shadow"><feGaussianBlur stdDeviation="5"/></filter>
      </defs>
      <ellipse cx="91" cy="140" rx="37" ry="8" fill="#9f6a1c" opacity=".25" filter="url(#adm-ring-shadow)"/>
      <g transform="rotate(-25 88 83)">
        <ellipse cx="94" cy="89" rx="40" ry="47" fill="none" stroke="url(#adm-ring-back)" strokeWidth="24"/>
        <ellipse cx="85" cy="79" rx="40" ry="47" fill="none" stroke="url(#adm-ring-yellow)" strokeWidth="24"/>
        <path d="M48 63a40 47 0 0 1 36-31" fill="none" stroke="url(#adm-ring-shine)" strokeWidth="23" strokeLinecap="round"/>
        <path d="M112 113a40 47 0 0 1-29 13" fill="none" stroke="#c89636" strokeWidth="23" strokeLinecap="round"/>
        <ellipse cx="85" cy="79" rx="27" ry="34" fill="none" stroke="#e0b14d" strokeWidth="1" opacity=".7"/>
      </g>
      <circle cx="130" cy="38" r="4" fill="#fff1bf"/>
      <circle cx="40" cy="120" r="3" fill="#a97523" opacity=".55"/>
    </svg>
  );
}
