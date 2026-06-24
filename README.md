# Vistoria Acontece

Sistema de vistoria de imóveis (uso interno Acontece), inspirado na estrutura do Devolus
e construído na identidade Acontece (verde #2B5C2B, dourado, Trebuchet MS, logo triângulo).

Web app de gestão + app de campo PWA offline-first, sobre **Supabase** (Postgres + Auth + Storage).

---

## Rodar localmente

```bash
npm install
cp .env.example .env      # preencha com URL e anon key do seu Supabase
npm run dev               # abre em http://localhost:5173
```

> **Sem Supabase ainda?** O app roda em **modo demonstração** com dados de exemplo —
> basta `npm run dev` e navegar. Login é dispensado até o Supabase estar configurado.

## Subir o banco

1. Crie um projeto em https://supabase.com
2. Vá em **SQL Editor**, cole o conteúdo de `supabase/migrations/0001_schema.sql` e rode.
3. Em **Settings → API**, copie a *Project URL* e a *anon key* para o seu `.env`.
4. Crie o primeiro usuário em **Authentication → Users** e, no SQL Editor, promova a admin:
   ```sql
   update public.profiles set papel = 'admin' where email = 'voce@acontece.com';
   ```

## Build e deploy

```bash
npm run build     # gera /dist (com service worker do PWA)
npm run preview   # testa o build local
```
Deploy estático em qualquer host (GitHub Pages, Vercel, Netlify). Para GitHub Pages,
ajuste `base` no `vite.config.js` para `/nome-do-repo/`.

---

## As quatro frentes — o que já está pronto

| Frente | Status nesta entrega |
|---|---|
| **1. Supabase** (schema + auth + CRUD) | Schema completo com RLS por papel (admin/comercial/vistoriador), Storage privado, triggers e seed dos cadastros reais. Client, auth e service layer wirados. |
| **2. Editor de vistoria** | Núcleo funcional: ambiente → item → estado de conservação (cor por gravidade) → cor/material → observação → **divergência** com responsável. Captura de foto pela câmera. |
| **3. App de campo PWA** | `vite-plugin-pwa` configurado (instalável, offline). Fila de sincronização em IndexedDB (`src/lib/sync.js`): grava offline e reenvia ao voltar a conexão. Indicador de offline/pendências no topo. |
| **4. Laudo em PDF** | Gerador real em `src/lib/pdf.js` (jsPDF) na marca Acontece, com ambientes, itens, divergências e bloco de assinaturas. Botão **Gerar laudo (PDF)** no editor. |

## Próximos passos sugeridos

- **Marcação de avaria sobre a foto** (canvas de desenho salvo em `fotos.anotacoes`)
- **Comparação entrada × saída** (campo `vistoria_modelo_id` já existe no schema)
- **Contestação do cliente** (tabela `contestacoes` pronta) + link/QR público do laudo
- **Importação do Imobiliar** → popular `imoveis` e `locadores` (como o Devolus faz com Imoview)
- **Assinatura digital** no dispositivo (canvas → `assinaturas.storage_path`)

## Estrutura

```
supabase/migrations/0001_schema.sql   schema completo do banco
src/lib/        supabase, auth, theme, sync (offline), vistoriasService, pdf, demo
src/components/ ui (primitivos), Shell (sidebar+topbar)
src/screens/    Login, Dashboard, Vistorias, Editor, Agenda, Cadastros
```
