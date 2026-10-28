/**
 * Envio do código de login. Com RESEND_API_KEY usa a API do Resend;
 * sem ela (desenvolvimento) só imprime o código no console.
 */
async function enviarCodigo(email, codigo) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[dev] código de login para ${email}: ${codigo}`);
    return;
  }
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [email],
      subject: `Seu código: ${codigo}`,
      text: `Seu código para entrar no Unofficial Stamp Rally é ${codigo}.\n\nEle vale por 10 minutos. Se não foi você, ignore este e-mail.\n\nUnofficial Stamp Rally é um projeto de fãs, não-oficial.`,
      html: `<p>Seu código para entrar no <b>Unofficial Stamp Rally</b> é:</p><p style="font-size:28px;letter-spacing:6px;font-weight:bold">${codigo}</p><p>Ele vale por 10 minutos. Se não foi você, ignore este e-mail.</p><p style="color:#777;font-size:12px">Unofficial Stamp Rally é um projeto de fãs, não-oficial.</p>`,
    }),
  });
  if (!resp.ok) throw new Error(`Falha ao enviar e-mail (${resp.status}): ${await resp.text()}`);
}

module.exports = { enviarCodigo };
