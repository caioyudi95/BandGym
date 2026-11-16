# BandGym · Vercel + Firebase

Arquivos deste pacote:

| Arquivo | Para que serve |
|---|---|
| `index.html` | O site BandGym completo (check-in, dashboard, relatórios, PSE, e-mails…) |
| `firebase-config.js` | **Você edita**: cole aqui a configuração do seu projeto Firebase |
| `firebase-backend.js` | Ponte com o Firebase: login com Google e banco Firestore (não precisa mexer) |
| `firestore.rules` | Regras de segurança do banco (cole no console do Firebase) |
| `vercel.json` | Configuração da hospedagem na Vercel (não precisa mexer) |

---

## Parte 1 · Firebase (≈ 10 min)

1. Acesse **console.firebase.google.com** → **Adicionar projeto** → nome `bandgym` → pode desativar o Google Analytics → **Criar projeto**.
2. **Banco de dados**: menu **Criação → Firestore Database → Criar banco de dados**
   - Local: **southamerica-east1 (São Paulo)**
   - Modo: **produção** → Criar.
3. **Regras de segurança**: ainda no Firestore, aba **Regras** → apague tudo → cole o conteúdo do arquivo `firestore.rules` → **Publicar**.
4. **Login com Google**: menu **Criação → Authentication → Vamos começar → Google** → ativar → escolha o e-mail de suporte → **Salvar**.
5. **Registrar o site**: ⚙ **Configurações do projeto → Geral → Seus apps → ícone `</>` (Web)** → apelido `bandgym-web` → **Registrar app** (não precisa marcar Hosting).
6. Copie o bloco `firebaseConfig` que aparece e cole no arquivo **`firebase-config.js`**, substituindo os `COLE_AQUI`. Fica assim:

```js
export const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "bandgym-xxxx.firebaseapp.com",
  projectId: "bandgym-xxxx",
  storageBucket: "bandgym-xxxx.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abc123"
};
```

> Esses dados **não são senha** — podem ficar públicos no site. Quem protege os dados são as regras + o login.

---

## Parte 2 · Vercel (≈ 5 min)

**Caminho A – pelo GitHub (recomendado, fica fácil atualizar depois)**
1. Em **github.com** → **New repository** → nome `bandgym` → **Private** → Create.
2. **Add file → Upload files** → arraste os 5 arquivos (`index.html`, `firebase-config.js` já preenchido, `firebase-backend.js`, `vercel.json`, `firestore.rules`) → **Commit**.
3. Em **vercel.com** → **Add New → Project** → importe o repositório `bandgym` → Framework: **Other** → **Deploy**.
4. Anote o endereço gerado (ex.: `bandgym.vercel.app`).

**Caminho B – pelo terminal**
```bash
npm i -g vercel
cd pasta-do-bandgym
vercel --prod
```

---

## Parte 3 · Autorizar o domínio e primeiro acesso

1. Firebase → **Authentication → Configurações → Domínios autorizados → Adicionar domínio** → cole `bandgym.vercel.app` (o seu endereço, sem `https://`).
2. Abra o site → **Entrar com Google** com a **sua** conta.
3. Vai aparecer **“Primeiro acesso”** → clique em **Sou o responsável · ativar**. Você vira o administrador.
   > Faça isso logo após publicar: a primeira conta a ativar vira a administradora.
4. Em **Configurações → Acesso**, libere o e-mail Google de cada professor (Professor ou Administrador).

Pronto: qualquer computador com login liberado vê e registra os mesmos check-ins em tempo real.

---

## Trazer dados da versão antiga

Na versão antiga: **Configurações → Exportar backup (.json)**.
Na nova (Firebase): **Configurações → Importar backup**.

## Dúvidas comuns

- **“Este endereço ainda não está autorizado”** → faltou o passo 3.1 (domínio autorizado).
- **“A conta X ainda não tem acesso”** → um administrador precisa liberar o e-mail em Configurações → Acesso.
- **“Falta configurar o Firebase”** → o `firebase-config.js` ainda está com `COLE_AQUI`.
- **Custo** → o plano gratuito (Spark) do Firebase e o plano Hobby da Vercel cobrem o uso de uma academia escolar.
- **Internet caiu** → o que já foi carregado continua na tela; novas entradas precisam de conexão para salvar.
