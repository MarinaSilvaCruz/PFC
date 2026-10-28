// Gera public/css/tokens.css a partir de design-system/tokens.json (cópia do design system "Unofficial Stamp Rally").
// Rode `npm run tokens` depois de atualizar o tokens.json.
const fs = require('node:fs');
const path = require('node:path');

const raiz = path.join(__dirname, '..');
const t = JSON.parse(fs.readFileSync(path.join(raiz, 'design-system/tokens.json'), 'utf8'));
const tema = t.color.themes[0].id;
const valor = (v) => (typeof v === 'string' ? v : v[tema]);

const linhas = [];
for (const c of t.color.tokens) linhas.push(`  --${c.name}: ${valor(c.value)};`);
for (const [nome, familia] of Object.entries(t.type.families)) linhas.push(`  --font-${nome}: ${familia};`);
for (const fam of ['spacing', 'radius']) for (const s of t[fam].tokens) linhas.push(`  --${s.name}: ${s.value};`);

const estilos = [];
for (const g of t.type.groups) {
  for (const s of g.styles) {
    estilos.push(`.${s.name} { font-family: var(--font-${g.family}); font-size: ${s.fontSize}; line-height: ${s.lineHeight}; font-weight: ${s.fontWeight}; }`);
  }
}

const css = `/* ${t.name} — gerado de design-system/tokens.json por scripts/gerar-tokens-css.js. Não edite à mão. */
:root {
${linhas.join('\n')}
}

${estilos.join('\n')}
`;
fs.writeFileSync(path.join(raiz, 'public/css/tokens.css'), css);
console.log('public/css/tokens.css atualizado');
