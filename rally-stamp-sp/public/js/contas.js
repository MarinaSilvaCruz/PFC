import { $, api, esc } from './util.js';
import { abrirFolha } from './folha.js';
import { cadeado } from './icones.js';

const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

/** aoEntrar(participante) é chamado quando o login/cadastro termina. */
let aoEntrar = () => {};
export function configurarContas(fn) { aoEntrar = fn; }

export function pedirLogin(subtitulo = 'Crie sua conta ou entre para ver a missão e começar a carimbar.') {
  const el = abrirFolha(`
    <div class="folha-ilustra" style="color: var(--ink-600)">${cadeado()}</div>
    <div class="folha-topo centro">
      <h2 class="heading-lg" id="folha-titulo">Faça login para acessar esta missão</h2>
      <p class="body-md texto-2">${esc(subtitulo)}</p>
    </div>
    <div class="acoes">
      <button class="btn btn-primario btn-bloco" data-acao="cadastro">Criar conta</button>
      <button class="btn btn-contorno btn-bloco" data-acao="entrar">Já tenho conta</button>
    </div>`);
  $('[data-acao="cadastro"]', el).onclick = () => formCadastro();
  $('[data-acao="entrar"]', el).onclick = () => formEntrar();
}

function campo({ id, rotulo, tipo = 'text', opcional = false, attrs = '' }) {
  return `
    <div class="campo" data-campo="${id}">
      <label for="c-${id}">${rotulo}${opcional ? ' <span class="opcional">(opcional)</span>' : ''}</label>
      <input id="c-${id}" name="${id}" type="${tipo}" ${opcional ? '' : 'required'} ${attrs}>
      <p class="campo-erro" hidden></p>
    </div>`;
}

function mostrarErros(form, resposta) {
  form.querySelectorAll('[data-campo]').forEach((c) => {
    c.removeAttribute('data-erro');
    $('.campo-erro', c).hidden = true;
  });
  const alerta = $('.alerta', form);
  alerta.hidden = true;
  const erros = resposta.erros || {};
  let primeiro = null;
  for (const [nome, msg] of Object.entries(erros)) {
    const c = form.querySelector(`[data-campo="${nome}"]`);
    if (!c) continue;
    c.setAttribute('data-erro', '');
    const p = $('.campo-erro', c);
    p.textContent = msg;
    p.hidden = false;
    primeiro ??= c.querySelector('input, select');
  }
  if (primeiro) primeiro.focus();
  else if (resposta.mensagem) {
    alerta.innerHTML = esc(resposta.mensagem);
    alerta.hidden = false;
  }
}

export function formCadastro(emailInicial = '') {
  const el = abrirFolha(`
    <div class="folha-topo">
      <h2 class="heading-lg" id="folha-titulo">Bora carimbar?</h2>
      <p class="body-md texto-2">Crie sua conta. Seu progresso fica salvo nela, em qualquer celular.</p>
    </div>
    <form class="form" novalidate>
      ${campo({ id: 'email', rotulo: 'E-mail', tipo: 'email', attrs: 'autocomplete="email" inputmode="email"' })}
      ${campo({ id: 'nome', rotulo: 'Como quer ser chamada(o)?', opcional: true, attrs: 'autocomplete="given-name" maxlength="80"' })}
      ${campo({ id: 'telefone', rotulo: 'Telefone / WhatsApp', tipo: 'tel', attrs: 'autocomplete="tel" inputmode="tel" placeholder="(11) 91234-5678"' })}
      <div class="linha-2">
        ${campo({ id: 'cidade', rotulo: 'Cidade', attrs: 'autocomplete="address-level2"' })}
        <div class="campo" data-campo="estado">
          <label for="c-estado">Estado</label>
          <select id="c-estado" name="estado" required autocomplete="address-level1">
            <option value="">UF</option>
            ${UFS.map((uf) => `<option>${uf}</option>`).join('')}
          </select>
          <p class="campo-erro" hidden></p>
        </div>
      </div>
      ${campo({ id: 'instagram', rotulo: 'Instagram', opcional: true, attrs: 'autocapitalize="none" autocorrect="off" placeholder="@seuuser"' })}
      <div class="campo" data-campo="consentimento">
        <label class="consentimento body-md">
          <input type="checkbox" name="consentimento">
          <span>Aceito que meus dados sejam usados para participar do rally, como descrito na <a href="#" data-acao="privacidade">política de privacidade</a>.</span>
        </label>
        <p class="campo-erro" hidden></p>
      </div>
      <p class="alerta" role="alert" hidden></p>
      <button class="btn btn-primario btn-bloco" type="submit">Criar conta</button>
      <p class="centro body-md">Já tem conta? <button type="button" class="btn-link body-md" data-acao="entrar">Entrar</button></p>
    </form>`);
  const form = $('form', el);
  form.email.value = emailInicial;
  form.estado.value = 'SP';
  $('[data-acao="entrar"]', el).onclick = () => formEntrar(form.email.value);
  $('[data-acao="privacidade"]', el).onclick = (e) => {
    e.preventDefault();
    const tpl = $('#tpl-privacidade').content.cloneNode(true);
    const box = document.createElement('div');
    box.className = 'alerta alerta-info';
    box.append(tpl);
    e.target.closest('.campo').after(box);
    e.target.removeAttribute('data-acao');
    e.target.onclick = (ev) => ev.preventDefault();
  };
  form.onsubmit = async (e) => {
    e.preventDefault();
    const botao = $('button[type="submit"]', form);
    botao.disabled = true;
    const dados = Object.fromEntries(new FormData(form));
    dados.consentimento = form.consentimento.checked;
    const r = await api('/auth/cadastro', { method: 'POST', body: dados });
    botao.disabled = false;
    if (r.ok) return formCodigo(r.dados.email);
    if (r.dados.erro === 'existe') return formEntrar(dados.email, r.dados.mensagem);
    mostrarErros(form, r.dados);
  };
}

export function formEntrar(emailInicial = '', aviso = '') {
  const el = abrirFolha(`
    <div class="folha-topo">
      <h2 class="heading-lg" id="folha-titulo">Que bom te ver de novo</h2>
      <p class="body-md texto-2">Informe seu e-mail. Vamos mandar um código de 6 números para você entrar.</p>
    </div>
    ${aviso ? `<p class="alerta alerta-info">${esc(aviso)}</p>` : ''}
    <form class="form" novalidate>
      ${campo({ id: 'email', rotulo: 'E-mail', tipo: 'email', attrs: 'autocomplete="email" inputmode="email"' })}
      <p class="alerta" role="alert" hidden></p>
      <button class="btn btn-primario btn-bloco" type="submit">Receber código</button>
      <p class="centro body-md">Ainda não tem conta? <button type="button" class="btn-link body-md" data-acao="cadastro">Criar conta</button></p>
    </form>`);
  const form = $('form', el);
  form.email.value = emailInicial;
  $('[data-acao="cadastro"]', el).onclick = () => formCadastro(form.email.value);
  form.onsubmit = async (e) => {
    e.preventDefault();
    const botao = $('button[type="submit"]', form);
    botao.disabled = true;
    const r = await api('/auth/entrar', { method: 'POST', body: { email: form.email.value } });
    botao.disabled = false;
    if (r.ok) return formCodigo(r.dados.email);
    if (r.dados.erro === 'nao_encontrado') {
      const alerta = $('.alerta', form);
      alerta.innerHTML = `${esc(r.dados.mensagem)} <button type="button" class="btn-link body-md">Criar conta</button>`;
      alerta.hidden = false;
      $('button', alerta).onclick = () => formCadastro(form.email.value);
      return;
    }
    mostrarErros(form, r.dados);
  };
}

function formCodigo(email) {
  const el = abrirFolha(`
    <div class="folha-topo">
      <h2 class="heading-lg" id="folha-titulo">Confira seu e-mail</h2>
      <p class="body-md texto-2">Mandamos um código de 6 números para <b>${esc(email)}</b>. Ele vale por 10 minutos. Se não chegar, olhe o spam.</p>
    </div>
    <form class="form" novalidate>
      <div class="campo" data-campo="codigo">
        <label for="c-codigo">Código</label>
        <input id="c-codigo" name="codigo" class="input-codigo" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]*" maxlength="6" required>
        <p class="campo-erro" hidden></p>
      </div>
      <p class="alerta" role="alert" hidden></p>
      <button class="btn btn-primario btn-bloco" type="submit">Entrar</button>
      <div class="centro">
        <button type="button" class="btn-link body-md" data-acao="reenviar">Reenviar código</button>
        <button type="button" class="btn-link body-md" data-acao="trocar">Trocar e-mail</button>
      </div>
    </form>`);
  const form = $('form', el);
  const input = form.codigo;
  input.focus();
  input.oninput = () => {
    input.value = input.value.replace(/\D/g, '').slice(0, 6);
    if (input.value.length === 6) form.requestSubmit();
  };
  $('[data-acao="trocar"]', el).onclick = () => formEntrar(email);
  $('[data-acao="reenviar"]', el).onclick = async (e) => {
    e.target.disabled = true;
    const r = await api('/auth/entrar', { method: 'POST', body: { email } });
    const alerta = $('.alerta', form);
    alerta.className = r.ok ? 'alerta alerta-info' : 'alerta';
    alerta.textContent = r.ok ? 'Código novo enviado.' : r.dados.mensagem;
    alerta.hidden = false;
    setTimeout(() => { e.target.disabled = false; }, 30000);
  };
  let enviando = false;
  form.onsubmit = async (e) => {
    e.preventDefault();
    if (enviando) return;
    enviando = true;
    const r = await api('/auth/verificar', { method: 'POST', body: { email, codigo: input.value } });
    enviando = false;
    if (r.ok) return aoEntrar(r.dados.participante);
    $('.alerta', form).className = 'alerta';
    mostrarErros(form, { mensagem: r.dados.mensagem });
    input.select();
  };
}
