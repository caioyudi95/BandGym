// POST /api/pedir-acesso — o professor logado (e-mail confirmado) pede acesso;
// o coordenador recebe um e-mail com o botão "Liberar".
import crypto from 'node:crypto';
import { firebase, usuarioDoPedido, baseUrl, esc, enviarEmail, emailLayout } from './_lib.js';

const INTERVALO_REENVIO = 6 * 3600 * 1000; // não reenvia o mesmo pedido antes de 6 h

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Use POST' });
  try {
    const u = await usuarioDoPedido(req);
    const { db } = firebase();
    const email = u.email.toLowerCase();
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const nome = String(u.name || body.nome || '').trim().slice(0, 120);

    const lista = (await db.doc('acesso/lista').get()).data() || { admins: [], emails: [] };
    const jaTem = (lista.admins || []).includes(email) || (lista.emails || []).includes(email) || (await db.doc('membros/' + email).get()).exists;
    if (jaTem) return res.json({ ok: true, liberado: true });

    const ref = db.doc('solicitacoes/' + email);
    const atual = await ref.get();
    if (atual.exists && Date.now() - (atual.data().em || 0) < INTERVALO_REENVIO) return res.json({ ok: true, jaPedido: true });

    const token = crypto.randomBytes(24).toString('hex');
    await ref.set({ email, nome, token, em: Date.now() });

    const dest = process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.split(',').map(s => s.trim()) : (lista.admins || []);
    const link = `${baseUrl(req)}/api/aprovar?e=${encodeURIComponent(email)}&t=${token}`;
    try {
      await enviarEmail({
        to: dest,
        subject: `BandGym · ${nome || email} pediu acesso`,
        html: emailLayout('Novo pedido de acesso',
          `<b>${esc(nome || 'Sem nome')}</b><br><span style="font-family:monospace">${esc(email)}</span><br><br>criou uma conta no BandGym e está aguardando liberação. Se você conhece essa pessoa, clique no botão abaixo.`,
          { href: link, texto: 'Ver pedido e liberar' })
      });
    } catch (e) {
      console.error('Falha ao enviar e-mail ao coordenador:', e.message);
      return res.json({ ok: true, emailFalhou: true });
    }
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(e.status || 500).json({ erro: e.message });
  }
}
