# Finance Manager

Um aplicativo de gerenciamento financeiro pessoal construído com [Next.js](https://nextjs.org/) (App Router), projetado para ajudar você a acompanhar suas receitas e despesas de forma simples e eficiente.

## 🚀 Tecnologias

Este projeto foi desenvolvido utilizando as seguintes tecnologias principais:

- **[Next.js 15](https://nextjs.org/)**: Framework React com App Router.
- **[React 19](https://react.dev/)**: Biblioteca JavaScript para interfaces de usuário.
- **[Prisma ORM](https://www.prisma.io/)**: Ferramenta de mapeamento objeto-relacional (ORM) para Node.js e TypeScript.
- **[SQLite](https://www.sqlite.org/index.html)**: Banco de dados relacional leve (configurado via Prisma).
- **[Tailwind CSS](https://tailwindcss.com/)**: Framework CSS utilitário para estilização rápida.
- **[Radix UI](https://www.radix-ui.com/)**: Componentes de UI primitivos acessíveis e sem estilo, base para o shadcn/ui.
- **[Lucide React](https://lucide.dev/)**: Biblioteca de ícones bonitos e consistentes.
- **[next-intl](https://next-intl-docs.vercel.app/)**: Internacionalização (i18n) para Next.js.
- **[TypeScript](https://www.typescriptlang.org/)**: Superset do JavaScript que adiciona tipagem estática.

## ✨ Funcionalidades

- **Dashboard**: Visão geral do seu saldo, total de receitas, total de despesas e transações recentes.
- **Transações**: Registro de entradas e saídas financeiras, com detalhes como valor, descrição, data de emissão e liquidação, categoria, conta e método de pagamento.
- **Categorias**: Organização de transações por categorias (Receitas, Despesas ou Ambos).
- **Contas**: Gerenciamento de múltiplas contas (Dinheiro, Banco, Cartão de Crédito, Investimento).
- **Métodos de Pagamento**: Registro das formas de pagamento utilizadas.
- **Internacionalização**: Suporte nativo para múltiplos idiomas através do pacote `next-intl`.
- **Modo Claro/Escuro**: Alternância de temas perfeitamente integrada ao sistema com `next-themes`.

## 📦 Estrutura de Diretórios

- `/app`: Páginas e rotas do Next.js (App Router).
- `/components`: Componentes reutilizáveis de interface (inclui componentes da UI gerados).
- `/hooks`: Hooks customizados do React.
- `/lib`: Utilitários e configurações (como o cliente do Prisma e i18n).
- `/locales`: Arquivos de tradução JSON para suportar diferentes idiomas.
- `/prisma`: Schema do banco de dados Prisma e arquivo de seed.
- `/public`: Arquivos estáticos (imagens, fontes, etc.).

## 🛠️ Como Rodar o Projeto Localmente

### Pré-requisitos

Certifique-se de ter instalado em sua máquina:
- [Node.js](https://nodejs.org/) (versão 18 ou superior recomendada)
- Gerenciador de pacotes da sua escolha: `npm`, `yarn`, `pnpm` ou `bun`.

### Instalação

1. Clone o repositório:
   ```bash
   git clone <url-do-repositorio>
   cd finance-manager
   ```

2. Instale as dependências:
   ```bash
   npm install
   # ou
   yarn install
   # ou
   pnpm install
   ```

3. Prepare o Banco de Dados (Prisma):
   A aplicação utiliza um banco de dados SQLite local (`prisma/finance_db.db`), eliminando a necessidade de configurar variáveis de ambiente para o banco. Execute o comando abaixo para criar o banco e sincronizar o schema:
   ```bash
   npx prisma db push --force-reset
   ```

4. Popular o Banco de Dados (Seed):
   Opcionalmente (recomendado), rode o script de seed para criar dados iniciais (contas, categorias, transações, etc.) no seu novo banco local:
   ```bash
   npm run db:seed
   ```

### Executando em Desenvolvimento

Inicie o servidor de desenvolvimento:

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
# ou
bun dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver a aplicação.

## 📝 Scripts Disponíveis

- `npm run dev`: Inicia o servidor de desenvolvimento.
- `npm run build`: Compila a aplicação para produção.
- `npm run start`: Inicia o servidor de produção com o build gerado.
- `npm run lint`: Executa o linter para encontrar possíveis problemas no código.
- `npm run db:seed`: Popula o banco de dados com dados iniciais definidos no seed.

## 📄 Licença

Este projeto foi gerado através do `create-next-app` e não possui uma licença específica definida atualmente. Fique à vontade para customizar para as suas necessidades.
