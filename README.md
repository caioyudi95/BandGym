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
4. **Login**: menu **Criação → Authentication → Método de login** → ative **Google** (escolha o e-mail de suporte) e também **E-mail/senha** → **Salvar**.
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
4. Em **Configurações → Acesso**, defina o **código de acesso da academia** (ou clique em Gerar) e salve.
5. Passe o link + o código para os professores: eles clicam em **Criar conta** (ou entram com Google), confirmam o e-mail, digitam o código e entram sozinhos. Para tirar alguém, use a lixeira na lista de professores. Trocar o código não tira quem já entrou.

Pronto: qualquer computador com login liberado vê e registra os mesmos check-ins em tempo real.

---

## Trazer dados da versão antiga

Na versão antiga: **Configurações → Exportar backup (.json)**.
Na nova (Firebase): **Configurações → Importar backup**.

## Dúvidas comuns

- **“Este endereço ainda não está autorizado”** → faltou o passo 3.1 (domínio autorizado).
- **“Código incorreto”** → confira o código em Configurações → Acesso (o admin precisa ter salvo um código).
- **Não chegou o e-mail de confirmação** → olhe o spam ou use “Reenviar e-mail”.
- **“Falta configurar o Firebase”** → o `firebase-config.js` ainda está com `COLE_AQUI`.
- **Custo** → o plano gratuito (Spark) do Firebase e o plano Hobby da Vercel cobrem o uso de uma academia escolar.
- **Internet caiu** → o que já foi carregado continua na tela; novas entradas precisam de conexão para salvar.

---

## Segurança e histórico

- **Toda gravação é assinada**: o banco registra o e-mail de quem fez e a hora do servidor. Gravação sem assinatura é recusada pelas regras.
- **Histórico imutável** (aba *Histórico*, só administradores): cada ação vira uma linha que ninguém consegue editar ou apagar pelo site.
- **Só administradores excluem** cadastros e professores (vão para a *Lixeira*, em Configurações, e podem ser restaurados).
- **Professores removem no máximo 1 check-in por vez**; cada exclusão fica no Histórico com botão **Restaurar**.
- Edições de cadastro guardam a versão anterior: no Histórico, **Versão anterior** desfaz a alteração.

> Sempre que o `firestore.rules` mudar, cole a versão nova em Firestore → Regras → **Publicar**.

---

## Liberação de professores por e-mail

Fluxo: o professor cria a conta → você recebe um e-mail **“Fulano pediu acesso”** → clica em **Liberar** → ele recebe **“Seu acesso foi liberado”** e a tela dele abre sozinha.
(Os pedidos também aparecem em **Configurações → Acesso**, com botões Liberar/Recusar. O código de acesso continua funcionando como alternativa.)

### Configurar (uma vez, ≈10 min)

**1. Chave do Firebase para o servidor**
Firebase → ⚙ Configurações do projeto → **Contas de serviço** → **Gerar nova chave privada** → baixa um arquivo `.json`.
> ⚠ Essa chave dá acesso total ao banco. **Nunca** suba esse arquivo no GitHub (o repositório é público).

**2. Senha de app do Gmail (para enviar os e-mails)**
1. Na conta Google que vai enviar (ex.: a sua), a **verificação em duas etapas** precisa estar ativa.
2. Acesse **myaccount.google.com/apppasswords** → nome `BandGym` → **Criar** → copie a senha de 16 letras.

**3. Variáveis na Vercel**
Projeto → **Settings → Environment Variables** → adicione:

| Nome | Valor |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | abra o `.json` do passo 1 num bloco de notas, copie **todo** o conteúdo e cole |
| `GMAIL_USER` | o e-mail Gmail que vai enviar (ex.: `seuemail@gmail.com`) |
| `GMAIL_APP_PASSWORD` | a senha de 16 letras do passo 2 |
| `ADMIN_EMAIL` *(opcional)* | quem recebe os pedidos (vários separados por vírgula). Se vazio, vai para os administradores do BandGym |

Depois: **Deployments → ⋯ no último deploy → Redeploy** (as variáveis só valem após um novo deploy).

**4. Regras** — cole o `firestore.rules` atualizado em Firestore → Regras → **Publicar**.

Alternativa ao Gmail: Resend (`RESEND_API_KEY` + `EMAIL_FROM`, exige domínio verificado para enviar a qualquer pessoa).
