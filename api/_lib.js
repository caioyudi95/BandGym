// BandGym · funções do servidor (Vercel) — utilidades compartilhadas
// Variáveis de ambiente (Vercel → Settings → Environment Variables):
//   FIREBASE_SERVICE_ACCOUNT  JSON da chave da conta de serviço do Firebase (obrigatória)
//   GMAIL_USER + GMAIL_APP_PASSWORD   envio pelo Gmail (recomendado)  — ou —
//   RESEND_API_KEY + EMAIL_FROM       envio pelo Resend
//   ADMIN_EMAIL (opcional)   quem recebe os pedidos; padrão: administradores do BandGym
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export function firebase() {
  if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) throw Object.assign(new Error('FIREBASE_SERVICE_ACCOUNT não configurada na Vercel'), { status: 500 });
    const sa = JSON.parse(raw);
    if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, '\n');
    initializeApp({ credential: cert(sa) });
  }
  return { auth: getAuth(), db: getFirestore(), FieldValue };
}

export async function usuarioDoPedido(req) {
  const h = req.headers.authorization || '';
  const tk = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!tk) throw Object.assign(new Error('Sem login'), { status: 401 });
  const { auth } = firebase();
  let u;
  try { u = await auth.verifyIdToken(tk); } catch (e) { throw Object.assign(new Error('Login inválido ou expirado'), { status: 401 }); }
  if (!u.email || !u.email_verified) throw Object.assign(new Error('E-mail ainda não confirmado'), { status: 403 });
  return u;
}

export function baseUrl(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return `${proto}://${host}`;
}

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export async function enviarEmail({ to, subject, html }) {
  const dest = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (!dest.length) throw new Error('Sem destinatário');
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    const nodemailer = (await import('nodemailer')).default;
    const t = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, '') } });
    await t.sendMail({ from: `BandGym <${process.env.GMAIL_USER}>`, to: dest.join(', '), subject, html });
    return;
  }
  if (process.env.RESEND_API_KEY) {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.EMAIL_FROM || 'BandGym <onboarding@resend.dev>', to: dest, subject, html })
    });
    if (!r.ok) throw new Error('Resend: ' + r.status + ' ' + (await r.text()).slice(0, 200));
    return;
  }
  throw new Error('Envio de e-mail não configurado (GMAIL_USER/GMAIL_APP_PASSWORD ou RESEND_API_KEY)');
}

export function emailLayout(titulo, corpo, botao) {
  return `<div style="background:#0a0a0d;padding:28px 12px;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:480px;margin:0 auto;background:#131317;border:1px solid #2a2a32;border-radius:16px;padding:28px;color:#f2f2f5">
    <div style="font-size:24px;font-weight:bold;color:#e3262d;margin-bottom:14px">BandGym</div>
    <div style="font-size:17px;font-weight:bold;margin-bottom:10px">${titulo}</div>
    <div style="font-size:14.5px;line-height:1.55;color:#c9c9d2">${corpo}</div>
    ${botao ? `<a href="${esc(botao.href)}" style="display:inline-block;margin-top:20px;background:#e3262d;color:#fff;text-decoration:none;font-weight:bold;padding:13px 22px;border-radius:10px">${esc(botao.texto)}</a>` : ''}
    <div style="font-size:11.5px;color:#6f6f7a;margin-top:24px">BandGym · Colégio Bandeirantes</div>
  </div></div>`;
}

export function pagina(titulo, corpo) {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>BandGym · ${esc(titulo)}</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0a0a0d;color:#f2f2f5;font:15px/1.5 Arial,Helvetica,sans-serif;padding:20px;box-sizing:border-box}
.b{width:min(440px,100%);background:#131317;border:1px solid #2a2a32;border-radius:18px;padding:28px;text-align:center}
h1{color:#e3262d;font-size:24px;margin:0 0 6px}h2{font-size:18px;margin:6px 0 12px}p{color:#c9c9d2}.m{font-family:monospace;color:#cfd3ff}
button,a.btn{display:block;width:100%;box-sizing:border-box;border:0;border-radius:12px;padding:14px;font-weight:bold;font-size:15px;cursor:pointer;margin-top:10px;text-decoration:none}
.ok{background:#e3262d;color:#fff}.no{background:#1f1f25;color:#f2f2f5;border:1px solid #34343d}</style></head>
<body><div class="b"><h1>BandGym</h1><h2>${esc(titulo)}</h2>${corpo}</div></body></html>`;
}
