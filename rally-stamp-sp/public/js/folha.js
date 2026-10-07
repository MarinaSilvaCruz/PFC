import { $ } from './util.js';

let aoFechar = null;

const dialogo = () => $('#folha');

export function abrirFolha(html, { onClose } = {}) {
  const d = dialogo();
  const anterior = aoFechar;
  aoFechar = null;
  anterior?.();
  $('#folha-conteudo').innerHTML = html;
  aoFechar = onClose || null;
  if (!d.open) d.showModal();
  $('#folha-conteudo').scrollTop = 0;
  d.scrollTop = 0;
  return $('#folha-conteudo');
}

export function fecharFolha() {
  if (dialogo().open) dialogo().close();
}

export function iniciarFolha() {
  const d = dialogo();
  $('#folha-fechar').addEventListener('click', fecharFolha);
  d.addEventListener('click', (e) => { if (e.target === d) fecharFolha(); });
  d.addEventListener('close', () => {
    const fn = aoFechar;
    aoFechar = null;
    fn?.();
    $('#folha-conteudo').innerHTML = '';
  });
}
