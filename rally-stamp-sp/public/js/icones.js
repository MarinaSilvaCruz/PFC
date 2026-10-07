export const cadeado = (aberto = false) => `
<svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
  <path d="${aberto ? 'M10 14v-4a6 6 0 0 1 11.6-2.2' : 'M10 14v-4a6 6 0 0 1 12 0v4'}" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>
  <rect x="6.5" y="14" width="19" height="13" rx="3.5" fill="currentColor"/>
  <circle cx="16" cy="20.5" r="2" fill="var(--surface-0)"/>
</svg>`;

/** Selo de tinta circular: o carimbo de cada local. */
export const seloTinta = (numero) => `
<svg class="selo-tinta" viewBox="0 0 84 84" aria-hidden="true">
  <circle cx="42" cy="42" r="38" fill="none" stroke="currentColor" stroke-width="3.5"/>
  <circle cx="42" cy="42" r="31" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <text x="42" y="31" text-anchor="middle" font-size="10.5" letter-spacing="1.5">RALLY SP</text>
  <text x="42" y="60" text-anchor="middle" font-size="28">${String(numero).padStart(2, '0')}</text>
  <path d="M24 36h36" stroke="currentColor" stroke-width="1.2"/>
</svg>`;

export const pin = `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 22s7-6.4 7-12a7 7 0 1 0-14 0c0 5.6 7 12 7 12z" fill="currentColor"/><circle cx="12" cy="10" r="2.6" fill="var(--surface-0)"/></svg>`;

export const camera = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="13" r="3.5" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
