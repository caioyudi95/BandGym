// GET  /api/aprovar?e=EMAIL&t=TOKEN  → página com "Liberar" / "Recusar"
// POST /api/aprovar (e, t, acao)     → libera (cria membros/EMAIL) ou recusa; avisa o professor por e-mail
// O GET não altera nada: assim, verificadores de link do e-mail não liberam ninguém sem querer.
import { firebase, baseUrl, esc, enviarEmail, emailLayout, pagina } from './_lib.js';

const VALIDADE = 14 * 24 * 3600 * 1000;

function lerBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const s = typeof req.body === 'string' ? req.body : '';
  return Object.fromEntries(new URLSearchParams(s));
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  try {
    const p = req.method === 'POST' ? lerBody(req) : req.query;
    const email = String(p.e || '').toLowerCase().trim();
    const token = String(p.t || '');
    if (!email || !token) return res.status(400).send(pagina('Link inválido', '<p>Este link está incompleto.</p>'));

    const { db, FieldValue } = firebase();
    const ref = db.doc('solicitacoes/' + email);
    const snap = await ref.get();
    const jaMembro = (await db.doc('membros/' + email).get()).exists;
    if (!snap.exists || snap.data().token !== token) {
      return res.status(jaMembro ? 200 : 404).send(pagina(jaMembro ? 'Acesso já liberado' : 'Pedido não encontrado',
        jaMembro ? `<p><span class="m">${esc(email)}</span> já tem acesso ao BandGym.</p>` : '<p>Este pedido já foi resolvido ou o link não é mais válido.</p>'));
    }
    const sol = snap.data();
    if (Date.now() - (sol.em || 0) > VALIDADE) {
      await ref.delete();
      return res.status(410).send(pagina('Pedido expirado', '<p>Este pedido tem mais de 14 dias. A pessoa pode pedir de novo entrando no site.</p>'));
    }

    if (req.method !== 'POST') {
      return res.send(pagina('Pedido de acesso', `<p><b>${esc(sol.nome || 'Sem nome')}</b><br><span class="m">${esc(email)}</span></p>
        <p>quer acessar o BandGym (check-in, alunos e relatórios).</p>
        <form method="post"><input type="hidden" name="e" value="${esc(email)}"><input type="hidden" name="t" value="${esc(token)}">
        <button class="ok" name="acao" value="liberar">✓ Liberar acesso</button>
        <button class="no" name="acao" value="recusar">Recusar</button></form>`));
    }

    const acao = p.acao === 'recusar' ? 'recusar' : 'liberar';
    const h = db.collection('historico').doc();
    const batch = db.batch();
    if (acao === 'liberar') {
      batch.set(db.doc('membros/' + email), { email, nome: sol.nome || '', em: Date.now(), via: 'aprovação por e-mail' });
      batch.set(h, { acao: 'Acesso', resumo: `Liberou o acesso de ${sol.nome ? sol.nome + ' · ' : ''}${email} (pelo e-mail)`, caminho: 'membros/' + email, _por: 'coordenador (link do e-mail)', _em: FieldValue.serverTimestamp() });
    } else {
      batch.set(h, { acao: 'Acesso', resumo: `Recusou o pedido de ${sol.nome ? sol.nome + ' · ' : ''}${email} (pelo e-mail)`, caminho: 'solicitacoes/' + email, _por: 'coordenador (link do e-mail)', _em: FieldValue.serverTimestamp() });
    }
    batch.delete(ref);
    await batch.commit();

    if (acao === 'recusar') return res.send(pagina('Pedido recusado', `<p>O pedido de <span class="m">${esc(email)}</span> foi recusado.</p>`));

    let aviso = '';
    try {
      await enviarEmail({
        to: email,
        subject: 'Seu acesso ao BandGym foi liberado',
        html: emailLayout(`Olá${sol.nome ? ', ' + esc(sol.nome.split(' ')[0]) : ''}!`, 'O coordenador liberou o seu acesso ao BandGym. Já pode entrar e registrar os check-ins.', { href: baseUrl(req), texto: 'Abrir o BandGym' })
      });
    } catch (e) {
      console.error('Falha ao avisar o professor:', e.message);
      aviso = '<p style="color:#f6d48a">Não consegui enviar o e-mail de aviso para a pessoa, mas o acesso já está liberado: ela só precisa abrir o site.</p>';
    }
    return res.send(pagina('Acesso liberado ✓', `<p><b>${esc(sol.nome || email)}</b> já pode usar o BandGym.${sol.nome ? `<br><span class="m">${esc(email)}</span>` : ''}</p>${aviso}<a class="btn no" href="${esc(baseUrl(req))}">Abrir o BandGym</a>`));
  } catch (e) {
    console.error(e);
    return res.status(e.status || 500).send(pagina('Algo deu errado', `<p>${esc(e.message)}</p>`));
  }
}
