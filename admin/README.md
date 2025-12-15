# FitJourney Admin Console

Painel administrativo Next.js para gestão do app FitJourney.

## Instalação

O projeto está na pasta `admin/`.

1. Navegue até a pasta:
   ```bash
   cd admin
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   Crie um arquivo `.env.local` dentro de `admin/` com:
   ```
   NEXT_PUBLIC_SUPABASE_URL=Sua_Url_Supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=Sua_Key_Anon
   ```

4. Rode o projeto:
   ```bash
   npm run dev
   ```

## Setup do Banco de Dados

1. Copie o conteúdo de `supabase/migrations/admin_schema.sql`.
2. Cole no SQL Editor do seu projeto Supabase e execute.
3. **Importante:** Para acessar o painel, você precisa adicionar seu usuário manualmente na tabela `admin_users` via SQL editor:
   ```sql
   insert into public.admin_users (user_id, role) values ('SEU_UUID_DO_AUTH', 'owner');
   ```
