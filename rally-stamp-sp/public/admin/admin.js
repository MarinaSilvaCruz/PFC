import { $, esc, toast, dataHora } from '/js/util.js';
import { abrirFolha, fecharFolha, iniciarFolha } from '/js/folha.js';

const CHAVE = 'rally:admin-token';
let token = '';
try { token = sessionStorage.getItem(CHAVE) || ''; } catch { /* sem storage */ }

async function adm(caminho, { method = 'GET', body } = {}) {
  const resp = await fetch(`/api/admin${caminho}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (resp.status === 401) { sair(); throw new Error('Token inválido.'); }
  return resp;
}
const json = async (resp) => ({ ok: resp.ok, dados: await resp.json().catch(() => ({})) });

function sair() {
  token = '';
  try { sessionStorage.removeItem(CHAVE); } catch { /* */ }
  $('#entrar').hidden = false;
  $('#abas').hidden = true;
  $('#participantes').hidden = true;
  $('#locais').hidden = true;
}

function trocarAba(nome) {
  document.querySelectorAll('[data-aba]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.aba === nome)));
  $('#participantes').hidden = nome !== 'participantes';
  $('#locais').hidden = nome !== 'locais';
  if (nome === 'participantes') carregarParticipantes();
  else carregarLocais();
}

async function carregarParticipantes() {
  const { dados } = await json(await adm('/participantes'));
  const { locais, participantes } = dados;
  $('#total-participantes').textContent = `(${participantes.length})`;
  const ordem = new Map(locais.map((l, i) => [l.id, i]));
  $('#tabela-participantes').innerHTML = `
    <thead><tr><th>E-mail</th><th>Nome</th><th>Telefone</th><th>Cidade/UF</th><th>Instagram</th><th>Carimbos</th><th>Cadastro</th></tr></thead>
    <tbody>${participantes.map((p) => {
      const feitos = new Map(p.carimbos.map((c) => [c.local_id, c.criado_em]));
      return `<tr>
        <td>${esc(p.email)}${p.email_verificado_em ? '' : ' <span class="chip chip-amarelo caption">não verificado</span>'}</td>
        <td>${esc(p.nome || '')}</td>
        <td>${esc(p.telefone)}</td>
        <td>${esc(p.cidade)}/${esc(p.estado)}</td>
        <td>${p.instagram ? `@${esc(p.instagram)}` : ''}</td>
        <td><b>${p.carimbos.length}/${locais.length}</b>
          <div class="mini-selos">${locais.map((l) => {
            const q = feitos.get(l.id);
            return `<span class="${q ? 'ok' : ''}" title="${esc(l.nome)}${q ? ` · ${dataHora(q).completo}` : ''}">${ordem.get(l.id) + 1}</span>`;
          }).join('')}</div></td>
        <td>${dataHora(p.criado_em).completo}</td>
      </tr>`;
    }).join('') || '<tr><td colspan="7">Ninguém se cadastrou ainda.</td></tr>'}</tbody>`;
}

async function baixar(caminho, nomeArquivo) {
  const resp = await adm(caminho);
  if (!resp.ok) return toast('Não deu para baixar.');
  const url = URL.createObjectURL(await resp.blob());
  const a = Object.assign(document.createElement('a'), { href: url, download: nomeArquivo });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

let locais = [];
async function carregarLocais() {
  locais = (await json(await adm('/locais'))).dados.locais;
  $('#lista-locais').innerHTML = locais.map((l) => `
    <article class="local-admin" ${l.ativo ? '' : 'data-inativo'}>
      <span class="chip ${l.ativo ? 'chip-menta' : 'chip-amarelo'} caption">#${l.ordem} · ${l.ativo ? 'ativo' : 'inativo'} · ${l.total_carimbos} carimbo(s)</span>
      <h2 class="heading-md">${esc(l.nome)}</h2>
      <p class="body-md texto-2">${esc(l.endereco)}</p>
      <p class="caption">lat ${l.lat}, lng ${l.lng} · raio ${l.raio_m} m</p>
      <p class="caption"><code>${esc(l.url_qr)}</code></p>
      <div class="acoes-linha">
        <button class="btn btn-contorno" data-editar="${l.id}">Editar</button>
        <button class="btn btn-secundario" data-qr="${l.id}">Baixar QR</button>
        <button class="btn btn-contorno" data-token="${l.id}">Trocar token</button>
        ${l.total_carimbos ? '' : `<button class="btn btn-contorno" data-excluir="${l.id}">Excluir</button>`}
      </div>
    </article>`).join('');
}

const CAMPOS = [
  ['nome', 'Nome', 'text', 'largo'], ['slug', 'Slug (usado na URL do QR)', 'text'], ['ordem', 'Ordem na trilha', 'number'],
  ['bairro', 'Bairro', 'text'], ['raio_m', 'Raio (m)', 'number'], ['endereco', 'Endereço', 'text', 'largo'],
  ['lat', 'Latitude', 'text'], ['lng', 'Longitude', 'text'], ['foto_qr_url', 'URL da foto de onde o QR está', 'url', 'largo'],
  ['descricao', 'Descrição', 'text', 'largo'],
];

function editarLocal(l = { raio_m: 150, ordem: locais.length + 1, ativo: true }) {
  const el = abrirFolha(`
    <h2 class="heading-lg" id="folha-titulo">${l.id ? 'Editar local' : 'Novo local'}</h2>
    <form class="form-grade" novalidate>
      ${CAMPOS.map(([n, r, t, cls]) => `
        <div class="campo ${cls || ''}" data-campo="${n}">
          <label for="l-${n}">${r}</label>
          <input id="l-${n}" name="${n}" type="${t}" value="${esc(l[n] ?? '')}" ${t === 'number' ? 'inputmode="numeric"' : ''}>
          <p class="campo-erro" hidden></p>
        </div>`).join('')}
      <label class="consentimento body-md largo"><input type="checkbox" name="ativo" ${l.ativo ? 'checked' : ''}> Ativo (aparece na cartela)</label>
      <p class="alerta largo" hidden></p>
      <button class="btn btn-primario btn-bloco largo">Salvar</button>
    </form>`);
  const form = $('form', el);
  form.onsubmit = async (e) => {
    e.preventDefault();
    const dados = Object.fromEntries(new FormData(form));
    dados.ativo = form.ativo.checked;
    const { ok, dados: r } = await json(await adm(l.id ? `/locais/${l.id}` : '/locais', { method: l.id ? 'PUT' : 'POST', body: dados }));
    if (ok) { fecharFolha(); toast('Local salvo.'); return carregarLocais(); }
    form.querySelectorAll('[data-campo]').forEach((c) => { c.removeAttribute('data-erro'); $('.campo-erro', c).hidden = true; });
    for (const [n, msg] of Object.entries(r.erros || {})) {
      const c = form.querySelector(`[data-campo="${n}"]`);
      c.setAttribute('data-erro', '');
      Object.assign($('.campo-erro', c), { textContent: msg, hidden: false });
    }
    Object.assign($('.alerta', form), { textContent: r.mensagem || 'Erro ao salvar.', hidden: false });
  };
}

function iniciar() {
  iniciarFolha();
  $('#entrar').onsubmit = async (e) => {
    e.preventDefault();
    token = $('#token').value.trim();
    const resp = await fetch('/api/admin/locais', { headers: { Authorization: `Bearer ${token}` } });
    if (!resp.ok) {
      const { dados } = await json(resp);
      return Object.assign($('#entrar-erro'), { textContent: dados.mensagem || 'Token inválido.', hidden: false });
    }
    try { sessionStorage.setItem(CHAVE, token); } catch { /* */ }
    mostrar();
  };
  document.querySelectorAll('[data-aba]').forEach((b) => { b.onclick = () => trocarAba(b.dataset.aba); });
  $('#baixar-csv').onclick = () => baixar('/participantes.csv', `participantes-${new Date().toISOString().slice(0, 10)}.csv`);
  $('#novo-local').onclick = () => editarLocal();
  $('#lista-locais').onclick = async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const id = Number(b.dataset.editar || b.dataset.qr || b.dataset.token || b.dataset.excluir);
    const l = locais.find((x) => x.id === id);
    if (b.dataset.editar) editarLocal(l);
    if (b.dataset.qr) baixar(`/locais/${id}/qr.png`, `qr-${l.slug}.png`);
    if (b.dataset.token && confirm(`Trocar o token de "${l.nome}"? QRs já impressos deste local param de funcionar.`)) {
      await adm(`/locais/${id}/novo-token`, { method: 'POST' });
      toast('Token trocado. Baixe e imprima o QR novo.');
      carregarLocais();
    }
    if (b.dataset.excluir && confirm(`Excluir "${l.nome}"?`)) {
      const { ok, dados } = await json(await adm(`/locais/${id}`, { method: 'DELETE' }));
      toast(ok ? 'Local excluído.' : dados.mensagem);
      carregarLocais();
    }
  };
  if (token) mostrar();
}

function mostrar() {
  $('#entrar').hidden = true;
  $('#abas').hidden = false;
  trocarAba('participantes');
}

iniciar();
