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
try { fs = F.initializeFirestore(app, { localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }) }); }
catch (e) { fs = F.getFirestore(app); }

// ---- Adaptador no formato que o app espera ----
const CODES = { 'permission-denied': 'invalid_argument', 'unauthenticated': 'revoked', 'resource-exhausted': 'resource_exhausted', 'unavailable': 'unavailable', 'deadline-exceeded': 'unavailable', 'aborted': 'unavailable', 'invalid-argument': 'invalid_argument', 'failed-precondition': 'unavailable' };
const mapErr = e => ({ code: CODES[e && e.code] || 'unavailable', message: (e && e.message) || String(e) });
const wrapDoc = s => ({ id: s.id, exists: s.exists(), data: () => s.data(), metadata: s.metadata });
const guard = p => p.catch(e => { throw mapErr(e); });
function docRef(path) {
  const r = F.doc(fs, path);
  return {
    id: r.id, path,
    get: () => guard(F.getDoc(r).then(wrapDoc)),
    set: d => guard(F.setDoc(r, d)),
    update: d => guard(F.updateDoc(r, d)),
    delete: () => guard(F.deleteDoc(r)),
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
  runDay: (date, mutate) => guard(F.runTransaction(fs, async tx => {
    const r = F.doc(fs, 'dias/' + date);
    const s = await tx.get(r);
    const cur = s.exists() ? JSON.parse(JSON.stringify(s.data())) : { date, items: [] };
    mutate(cur);
    tx.set(r, cur);
  }))
};

// ---- Login e controle de acesso ----
const listaRef = F.doc(fs, 'acesso/lista');
let started = false, unsubLista = null, detail = null;

function telaLogin(msg = '') {
  show(`<p>Entre com a sua conta Google para registrar os check-ins.</p><button id="fb-in">${G} Entrar com Google</button><div class="err">${esc(msg)}</div>`);
  gate.querySelector('#fb-in').onclick = async () => {
    const prov = new A.GoogleAuthProvider(); prov.setCustomParameters({ prompt: 'select_account' });
    try { await A.signInWithPopup(auth, prov); }
    catch (e) {
      if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') { await A.signInWithRedirect(auth, prov); return; }
      if (e.code === 'auth/unauthorized-domain') telaLogin('Este endereço ainda não está autorizado no Firebase (Authentication → Configurações → Domínios autorizados).');
      else if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') telaLogin('Não foi possível entrar: ' + (e.code || e.message));
    }
  };
}
function telaSemAcesso(email) {
  show(`<p>A conta <span class="mail">${esc(email)}</span> ainda não tem acesso ao BandGym.<br>Peça a um administrador para liberar o seu e-mail em <b>Configurações → Acesso</b>.</p><button class="sec" id="fb-out">Entrar com outra conta</button>`);
  gate.querySelector('#fb-out').onclick = () => A.signOut(auth);
}
function telaPrimeiroAcesso(email) {
  show(`<p><b>Primeiro acesso.</b><br>Ainda não existe nenhum administrador. A conta <span class="mail">${esc(email)}</span> vai virar a administradora do BandGym e poderá liberar os professores.</p><button class="red" id="fb-adm">Sou o responsável · ativar</button><button class="sec" id="fb-out">Usar outra conta</button><div class="err" id="fb-err"></div>`);
  gate.querySelector('#fb-out').onclick = () => A.signOut(auth);
  gate.querySelector('#fb-adm').onclick = async () => {
    try { await F.setDoc(listaRef, { admins: [email], emails: [] }); }
    catch (e) { gate.querySelector('#fb-err').textContent = e.code === 'permission-denied' ? 'Não foi possível: confira se as regras do firestore.rules foram publicadas.' : 'Erro: ' + (e.code || e.message); }
  };
}
const temAcesso = (L, e) => !!L && ((L.admins || []).includes(e) || (L.emails || []).includes(e));

A.onAuthStateChanged(auth, user => {
  if (unsubLista) { unsubLista(); unsubLista = null; }
  if (!user) { if (started) { location.reload(); return; } telaLogin(); return; }
  const email = (user.email || '').toLowerCase();
  show('<p>Verificando acesso…</p>');
  unsubLista = F.onSnapshot(listaRef, snap => {
    const L = snap.exists() ? snap.data() : null;
    if (!L) { if (!snap.metadata.fromCache) telaPrimeiroAcesso(email); return; }
    if (!temAcesso(L, email)) { if (started) { location.reload(); return; } if (!snap.metadata.fromCache) telaSemAcesso(email); return; }
    const isAdmin = (L.admins || []).includes(email);
    if (!started) {
      started = true;
      detail = { db, user: { email, nome: user.displayName || '' }, isAdmin, acesso: L, signOut: () => A.signOut(auth), onAcesso: null };
      window.__bandgymBackend = detail;
      window.dispatchEvent(new CustomEvent('bandgym-backend', { detail }));
      hide();
    } else {
      detail.acesso = L; detail.isAdmin = isAdmin;
      if (detail.onAcesso) detail.onAcesso();
    }
  }, e => {
    if (e.code === 'permission-denied') telaSemAcesso(email);
    else show(`<p>Não foi possível conectar ao Firebase (${esc(e.code)}). Verifique a internet e recarregue a página.</p>`);
  });
});
