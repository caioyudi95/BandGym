// BandGym · ponte com o Firebase (login Google + Firestore)
import { firebaseConfig } from './firebase-config.js';
const V = '10.12.2';
const B = `https://www.gstatic.com/firebasejs/${V}`;

const css = `
#fb-gate{position:fixed;inset:0;z-index:90;background:radial-gradient(circle at 50% 30%,#1a0b0c 0%,#0a0a0d 60%);display:grid;place-items:center;padding:20px;font-family:Inter,system-ui,sans-serif;color:#f2f2f5}
#fb-gate .box{width:min(420px,100%);background:#131317;border:1px solid #2a2a32;border-radius:20px;padding:32px 28px;text-align:center;box-shadow:0 30px 80px rgba(0,0,0,.6)}
#fb-gate img.logo{width:110px;height:110px;border-radius:50%;margin-bottom:14px}
#fb-gate h1{font:700 26px/1.1 Oswald,Inter,sans-serif;color:#e3262d;margin:0 0 6px;letter-spacing:.5px}
#fb-gate p{color:#a0a0ac;margin:0 0 22px;font-size:14.5px;line-height:1.5}
#fb-gate button{all:unset;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;width:100%;box-sizing:border-box;padding:13px 16px;border-radius:12px;font-weight:700;background:#fff;color:#1f1f1f;margin-top:10px}
#fb-gate button.sec{background:#1f1f25;color:#f2f2f5;border:1px solid #34343d}
#fb-gate button.red{background:linear-gradient(180deg,#e3262d,#a8141a);color:#fff}
#fb-gate .err{color:#ff8a8e;font-size:13.5px;margin-top:14px;min-height:18px}
#fb-gate .mail{font-family:ui-monospace,Consolas,monospace;color:#cfd3ff;font-size:13px}
#fb-gate form{display:flex;flex-direction:column;gap:10px;text-align:left;margin-top:6px}
#fb-gate input{background:#0f0f13;border:1.5px solid #34343d;border-radius:12px;padding:12px 14px;color:#f2f2f5;font:inherit;outline:none}
#fb-gate input:focus{border-color:#e3262d}
#fb-gate label{font-size:13px;font-weight:700;display:flex;flex-direction:column;gap:6px}
#fb-gate .or{display:flex;align-items:center;gap:10px;color:#6f6f7a;font-size:12px;margin:16px 0 4px}
#fb-gate .or:before,#fb-gate .or:after{content:"";flex:1;border-top:1px solid #2a2a32}
#fb-gate .links{display:flex;justify-content:space-between;gap:10px;margin-top:14px;font-size:13.5px}
#fb-gate a{color:#ff6b70;cursor:pointer;text-decoration:none;font-weight:600}
#fb-gate .ok{color:#6fe0a3;font-size:13.5px;margin-top:14px}
#fb-gate .school{margin-top:22px;opacity:.5}#fb-gate .school img{height:30px}
`;
const G = '<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.5z"/></svg>';

const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
const gate = document.createElement('div'); gate.id = 'fb-gate'; document.body.appendChild(gate);
const logo = (document.querySelector('.brand img') || {}).src || '';
const school = (document.querySelector('#school img') || {}).src || '';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function show(inner) {
  gate.style.display = 'grid';
  gate.innerHTML = `<div class="box">${logo ? `<img class="logo" src="${logo}" alt="">` : ''}<h1>BandGym</h1>${inner}${school ? `<div class="school"><img src="${school}" alt="Colégio Bandeirantes"></div>` : ''}</div>`;
}
function hide() { gate.style.display = 'none'; }

if (!firebaseConfig || String(firebaseConfig.apiKey).includes('COLE_AQUI')) {
  show(`<p>Falta configurar o Firebase.<br>Abra o arquivo <b>firebase-config.js</b> e cole o <b>firebaseConfig</b> do seu projeto.</p>`);
  throw new Error('firebase-config.js não preenchido');
}

show('<p>Carregando…</p>');
const [{ initializeApp }, A, F] = await Promise.all([
  import(`${B}/firebase-app.js`), import(`${B}/firebase-auth.js`), import(`${B}/firebase-firestore.js`)
]);
const app = initializeApp(firebaseConfig);
const auth = A.getAuth(app);
auth.languageCode = 'pt';
let fs;
try { fs = F.initializeFirestore(app, { ignoreUndefinedProperties: true }); }
catch (e) { fs = F.getFirestore(app); }

// ---- Adaptador no formato que o app espera ----
const CODES = { 'permission-denied': 'invalid_argument', 'unauthenticated': 'revoked', 'resource-exhausted': 'resource_exhausted', 'unavailable': 'unavailable', 'deadline-exceeded': 'unavailable', 'aborted': 'unavailable', 'invalid-argument': 'invalid_argument', 'failed-precondition': 'unavailable' };
const mapErr = e => ({ code: CODES[e && e.code] || 'unavailable', message: (e && e.message) || String(e) });
const wrapDoc = s => ({ id: s.id, exists: s.exists(), data: () => s.data({ serverTimestamps: 'estimate' }), metadata: s.metadata });
// ---- Assinatura + histórico: toda gravação vai junto com uma linha no histórico (as regras exigem) ----
let ME = '';
const limpo = d => JSON.parse(JSON.stringify(d ?? null));
function linha(path, meta) {
  const ref = F.doc(F.collection(fs, 'historico'));
  const h = { acao: (meta && meta.acao) || 'Alteração', resumo: String((meta && meta.resumo) || path).slice(0, 500), caminho: path, _por: ME, _em: F.serverTimestamp() };
  if (meta && meta.dados) h.dados = limpo(meta.dados);
  return [ref, h];
}
const assinar = (d, logId) => Object.assign(limpo(d), { _por: ME, _em: F.serverTimestamp(), _log: logId });
const guard = p => p.catch(e => { throw mapErr(e); });
function docRef(path) {
  const r = F.doc(fs, path);
  return {
    id: r.id, path,
    get: () => guard(F.getDoc(r).then(wrapDoc)),
    set: (d, meta) => { const [hr, h] = linha(path, meta); const b = F.writeBatch(fs); b.set(r, assinar(d, hr.id)); b.set(hr, h); return guard(b.commit()); },
    delete: meta => { const [hr, h] = linha(path, meta); const b = F.writeBatch(fs); b.delete(r); b.set(hr, h); return guard(b.commit()); },
    onSnapshot: (next, err) => F.onSnapshot(r, { includeMetadataChanges: true }, s => next(wrapDoc(s)), e => err && err(mapErr(e)))
  };
}
function queryRef(q) {
  return {
    where: (f, op, v) => queryRef(F.query(q, F.where(f, op, v))),
    orderBy: (f, d) => queryRef(F.query(q, F.orderBy(f, d))),
    limit: n => queryRef(F.query(q, F.limit(n))),
    get: () => guard(F.getDocs(q).then(s => ({ docs: s.docs.map(wrapDoc), size: s.size, empty: s.empty, metadata: s.metadata }))),
    onSnapshot: (next, err) => F.onSnapshot(q, { includeMetadataChanges: true }, s => next({ docs: s.docs.map(wrapDoc), size: s.size, empty: s.empty, metadata: s.metadata }), e => err && err(mapErr(e)))
  };
}
const db = {
  doc: docRef,
  collection: p => Object.assign(queryRef(F.collection(fs, p)), { doc: id => docRef(p + '/' + id) }),
  // Check-ins do dia gravados em transação: dois computadores ao mesmo tempo não se sobrescrevem
  runDay: (date, mutate, meta) => guard(F.runTransaction(fs, async tx => {
    const r = F.doc(fs, 'dias/' + date);
    const s = await tx.get(r);
    const cur = s.exists() ? JSON.parse(JSON.stringify(s.data())) : { date, items: [] };
    mutate(cur);
    const [hr, h] = linha('dias/' + date, meta);
    tx.set(r, assinar(cur, hr.id));
    tx.set(hr, h);
  }))
};

// ---- Login e controle de acesso ----
const listaRef = F.doc(fs, 'acesso/lista');
let started = false, unsubLista = null, detail = null;

const MSG = {
  'auth/invalid-credential': 'E-mail ou senha incorretos.', 'auth/wrong-password': 'E-mail ou senha incorretos.', 'auth/user-not-found': 'E-mail ou senha incorretos.',
  'auth/email-already-in-use': 'Já existe uma conta com esse e-mail. Use "Entrar" ou "Esqueci a senha".',
  'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.', 'auth/invalid-email': 'E-mail inválido.',
  'auth/missing-password': 'Digite a senha.', 'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
  'auth/operation-not-allowed': 'O login com e-mail e senha ainda não foi ativado no Firebase (Authentication → Método de login → E-mail/senha).',
  'auth/unauthorized-domain': 'Este endereço ainda não está autorizado no Firebase (Authentication → Configurações → Domínios autorizados).',
  'auth/network-request-failed': 'Sem conexão com a internet.'
};
const msgErr = e => MSG[e && e.code] || ('Não foi possível concluir: ' + ((e && e.code) || e));
const val = id => (gate.querySelector('#' + id) || {}).value || '';
function setErr(t) { const el = gate.querySelector('.err'); if (el) el.textContent = t; }

async function entrarGoogle() {
  const prov = new A.GoogleAuthProvider(); prov.setCustomParameters({ prompt: 'select_account' });
  try { await A.signInWithPopup(auth, prov); }
  catch (e) {
    if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') { await A.signInWithRedirect(auth, prov); return; }
    if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') setErr(msgErr(e));
  }
}
function telaLogin(msg = '') {
  show(`<p>Entre para registrar os check-ins.</p>
    <button id="fb-in">${G} Entrar com Google</button>
    <div class="or">ou com e-mail e senha</div>
    <form id="fb-form" novalidate>
      <input id="fb-email" type="email" placeholder="E-mail" autocomplete="username">
      <input id="fb-pass" type="password" placeholder="Senha" autocomplete="current-password">
      <button class="red" type="submit">Entrar</button>
    </form>
    <div class="links"><a id="fb-new">Criar conta</a><a id="fb-forgot">Esqueci a senha</a></div>
    <div class="err">${esc(msg)}</div>`);
  gate.querySelector('#fb-in').onclick = entrarGoogle;
  gate.querySelector('#fb-new').onclick = () => telaCadastro();
  gate.querySelector('#fb-forgot').onclick = () => telaEsqueci(val('fb-email'));
  gate.querySelector('#fb-form').onsubmit = async e => {
    e.preventDefault();
    const email = val('fb-email').trim(), pass = val('fb-pass');
    if (!email || !pass) { setErr('Digite e-mail e senha.'); return; }
    try { await A.signInWithEmailAndPassword(auth, email, pass); } catch (err) { setErr(msgErr(err)); }
  };
}
function telaCadastro() {
  show(`<p><b>Criar conta de professor</b><br>Para quem não usa conta Google.</p>
    <form id="fb-form" novalidate>
      <label>Nome completo<input id="fb-nome" autocomplete="name" placeholder="Seu nome"></label>
      <label>E-mail<input id="fb-email" type="email" autocomplete="username" placeholder="voce@email.com"></label>
      <label>Senha<input id="fb-pass" type="password" autocomplete="new-password" placeholder="Mínimo 6 caracteres"></label>
      <label>Repita a senha<input id="fb-pass2" type="password" autocomplete="new-password"></label>
      <button class="red" type="submit">Criar conta</button>
    </form>
    <div class="links"><a id="fb-back">← Já tenho conta</a></div>
    <div class="err"></div>`);
  gate.querySelector('#fb-back').onclick = () => telaLogin();
  gate.querySelector('#fb-form').onsubmit = async e => {
    e.preventDefault();
    const nome = val('fb-nome').trim(), email = val('fb-email').trim().toLowerCase(), p1 = val('fb-pass'), p2 = val('fb-pass2');
    if (nome.length < 3) return setErr('Digite o seu nome completo.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setErr('E-mail inválido.');
    if (p1.length < 6) return setErr('A senha precisa ter pelo menos 6 caracteres.');
    if (p1 !== p2) return setErr('As senhas não são iguais.');
    const btn = gate.querySelector('button[type=submit]'); btn.style.opacity = .6; btn.style.pointerEvents = 'none';
    try {
      const cred = await A.createUserWithEmailAndPassword(auth, email, p1);
      await A.updateProfile(cred.user, { displayName: nome });
      await A.sendEmailVerification(cred.user);
      telaVerificar(cred.user, true);
    } catch (err) { setErr(msgErr(err)); btn.style.opacity = 1; btn.style.pointerEvents = ''; }
  };
}
function telaEsqueci(email = '') {
  show(`<p><b>Recuperar senha</b><br>Enviaremos um link para criar uma nova senha.</p>
    <form id="fb-form" novalidate><input id="fb-email" type="email" placeholder="E-mail" value="${esc(email)}"><button class="red" type="submit">Enviar link</button></form>
    <div class="links"><a id="fb-back">← Voltar</a></div><div class="err"></div><div class="ok"></div>`);
  gate.querySelector('#fb-back').onclick = () => telaLogin();
  gate.querySelector('#fb-form').onsubmit = async e => {
    e.preventDefault();
    const em = val('fb-email').trim(); if (!em) return setErr('Digite o seu e-mail.');
    try { await A.sendPasswordResetEmail(auth, em); setErr(''); gate.querySelector('.ok').textContent = `Se existir uma conta com ${em}, o link chegará em instantes. Confira também o spam.`; }
    catch (err) { setErr(msgErr(err)); }
  };
}
function telaVerificar(user, recemCriada = false) {
  show(`<p>${recemCriada ? '<b>Conta criada!</b><br>' : ''}Enviamos um link de confirmação para<br><span class="mail">${esc(user.email)}</span>.<br>Abra o e-mail (confira o spam), clique no link e depois volte aqui.</p>
    <button class="red" id="fb-ok">Já confirmei o e-mail</button>
    <button class="sec" id="fb-re">Reenviar e-mail</button>
    <button class="sec" id="fb-out">Sair</button><div class="err"></div><div class="ok"></div>`);
  gate.querySelector('#fb-out').onclick = () => A.signOut(auth);
  gate.querySelector('#fb-re').onclick = async () => { try { await A.sendEmailVerification(user); gate.querySelector('.ok').textContent = 'E-mail reenviado.'; setErr(''); } catch (e) { setErr(msgErr(e)); } };
  gate.querySelector('#fb-ok').onclick = async () => {
    try { await auth.currentUser.reload(); } catch (e) { }
    if (!auth.currentUser.emailVerified) { setErr('Ainda não confirmado. Clique no link do e-mail e tente de novo.'); return; }
    await auth.currentUser.getIdToken(true);
    entrou(auth.currentUser);
  };
}
let pedidoMostrado = false;
async function telaPedido(email, nome) {
  if (pedidoMostrado) return; pedidoMostrado = true;
  show(`<p>Olá${nome ? ', <b>' + esc(nome.split(' ')[0]) + '</b>' : ''}!<br>A conta <span class="mail">${esc(email)}</span> ainda não tem acesso ao BandGym.</p>
    <p class="ok" id="fb-ped" style="margin-top:-8px">Enviando pedido de acesso ao coordenador…</p>
    <p>Quando ele liberar, você recebe um e-mail e <b>esta tela abre sozinha</b>.</p>
    <button class="sec" id="fb-cod-link">Tenho um código de acesso</button>
    <button class="sec" id="fb-out">Entrar com outra conta</button>`);
  gate.querySelector('#fb-out').onclick = () => { pedidoMostrado = false; A.signOut(auth); };
  gate.querySelector('#fb-cod-link').onclick = () => { pedidoMostrado = false; telaCodigo(email, nome); };
  const el = () => gate.querySelector('#fb-ped');
  try {
    const tk = await auth.currentUser.getIdToken(true);
    const r = await fetch('/api/pedir-acesso', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tk }, body: JSON.stringify({ nome }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.erro || ('erro ' + r.status));
    if (el()) el().textContent = j.jaPedido ? '✓ Seu pedido já foi enviado. Aguarde a liberação.' : j.emailFalhou ? '✓ Pedido registrado. (O e-mail ao coordenador falhou: avise-o pessoalmente.)' : '✓ Pedido enviado ao coordenador por e-mail.';
  } catch (e) {
    if (el()) { el().className = 'err'; el().textContent = 'Não foi possível enviar o pedido automático (' + e.message + '). Avise o coordenador ou use um código de acesso.'; }
  }
}
function telaCodigo(email, nome) {
  show(`<p>Bem-vindo${nome ? ', <b>' + esc(nome.split(' ')[0]) + '</b>' : ''}!<br>Para liberar a conta <span class="mail">${esc(email)}</span>, digite o <b>código de acesso da academia</b> (peça ao coordenador).</p>
    <form id="fb-form" novalidate><input id="fb-cod" placeholder="Código de acesso" autocomplete="off" autocapitalize="characters" style="text-align:center;letter-spacing:2px;font-weight:700"><button class="red" type="submit">Liberar meu acesso</button></form>
    <button class="sec" id="fb-out">Entrar com outra conta</button><div class="err"></div>`);
  gate.querySelector('#fb-out').onclick = () => A.signOut(auth);
  gate.querySelector('#fb-cod').focus();
  gate.querySelector('#fb-out').insertAdjacentHTML('beforebegin', '<button class="sec" id="fb-volta">← Voltar</button>');
  gate.querySelector('#fb-volta').onclick = () => telaPedido(email, nome);
  gate.querySelector('#fb-form').onsubmit = async e => {
    e.preventDefault();
    const codigo = val('fb-cod').trim().toUpperCase();
    if (!codigo) return setErr('Digite o código.');
    try { await F.setDoc(F.doc(fs, 'membros/' + email), { email, nome, codigo, em: Date.now() }); setErr(''); }
    catch (err) { setErr(err.code === 'permission-denied' ? 'Código incorreto (ou ainda não definido pelo coordenador).' : msgErr(err)); }
  };
}
function telaPrimeiroAcesso(email) {
  show(`<p><b>Primeiro acesso.</b><br>Ainda não existe nenhum administrador. A conta <span class="mail">${esc(email)}</span> vai virar a administradora do BandGym.</p><button class="red" id="fb-adm">Sou o responsável · ativar</button><button class="sec" id="fb-out">Usar outra conta</button><div class="err" id="fb-err"></div>`);
  gate.querySelector('#fb-out').onclick = () => A.signOut(auth);
  gate.querySelector('#fb-adm').onclick = async () => {
    try { await F.setDoc(listaRef, { admins: [email], emails: [] }); }
    catch (e) { gate.querySelector('#fb-err').textContent = e.code === 'permission-denied' ? 'Não foi possível: confira se as regras do firestore.rules foram publicadas.' : 'Erro: ' + (e.code || e.message); }
  };
}
const temAcesso = (L, e) => !!L && ((L.admins || []).includes(e) || (L.emails || []).includes(e));

let subs = [], adminSubs = [];
const offAll = arr => { arr.forEach(f => f()); arr.length = 0; };
A.onAuthStateChanged(auth, user => {
  offAll(subs); offAll(adminSubs);
  if (!user) { if (started) { location.reload(); return; } telaLogin(); return; }
  if (!user.emailVerified) { telaVerificar(user); return; }
  // Credencial antiga (de antes da confirmação do e-mail)? Renova antes de acessar o banco.
  user.getIdTokenResult().then(r => r.claims.email_verified ? null : user.getIdToken(true)).catch(() => null).then(() => entrou(user));
});
function entrou(user) {
  offAll(subs); offAll(adminSubs);
  const email = (user.email || '').toLowerCase();
  const nome = user.displayName || '';
  ME = email;
  show('<p>Verificando acesso…</p>');
  let L, M, gotL = false, gotM = false;
  const avaliar = () => {
    if (!gotL || !gotM) return;
    if (!L) { telaPrimeiroAcesso(email); return; }
    const ok = temAcesso(L, email) || M;
    if (!ok) { if (started) { location.reload(); return; } telaPedido(email, nome); return; }
    const isAdmin = (L.admins || []).includes(email);
    if (!started) {
      started = true;
      detail = { db, user: { email, nome }, isAdmin, acesso: L, membros: [], solicitacoes: [], codigo: '', signOut: () => A.signOut(auth), onAcesso: null };
      window.__bandgymBackend = detail;
      window.dispatchEvent(new CustomEvent('bandgym-backend', { detail }));
      hide();
    } else { detail.acesso = L; detail.isAdmin = isAdmin; }
    if (isAdmin && !adminSubs.length) {
      adminSubs.push(F.onSnapshot(F.collection(fs, 'membros'), sn => { detail.membros = sn.docs.map(d => d.data()).sort((a, b) => (b.em || 0) - (a.em || 0)); if (detail.onAcesso) detail.onAcesso(); }, () => { }));
      adminSubs.push(F.onSnapshot(F.collection(fs, 'solicitacoes'), sn => { detail.solicitacoes = sn.docs.map(d => d.data()).sort((a, b) => (b.em || 0) - (a.em || 0)); if (detail.onAcesso) detail.onAcesso(); }, () => { }));
      adminSubs.push(F.onSnapshot(F.doc(fs, 'acesso/codigo'), sn => { detail.codigo = sn.exists() ? (sn.data().valor || '') : ''; if (detail.onAcesso) detail.onAcesso(); }, () => { }));
    } else if (!isAdmin) offAll(adminSubs);
    if (detail.onAcesso) detail.onAcesso();
  };
  const falha = e => show(`<p>Não foi possível conectar ao Firebase (${esc(e.code)}). Verifique a internet e recarregue a página.</p><button class="sec" id="fb-out">Sair</button>`) || (gate.querySelector('#fb-out').onclick = () => A.signOut(auth));
  subs.push(F.onSnapshot(listaRef, snap => { if (snap.metadata.fromCache && !snap.exists()) return; L = snap.exists() ? snap.data() : null; gotL = true; avaliar(); }, falha));
  subs.push(F.onSnapshot(F.doc(fs, 'membros/' + email), snap => { if (snap.metadata.fromCache && !snap.exists()) return; M = snap.exists(); gotM = true; avaliar(); }, falha));
}
