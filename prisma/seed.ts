import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaBetterSqlite3({ url: connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Iniciando seed do banco de dados...");

  // Limpar dados existentes
  await prisma.transaction.deleteMany();
  await prisma.category.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.account.deleteMany();

  // Criar Categorias
  console.log("Criando categorias...");
  const categories = await Promise.all([
    // Categorias de Entrada
    prisma.category.create({ data: { name: "Salário", kind: "IN" } }),
    prisma.category.create({ data: { name: "Freelance", kind: "IN" } }),
    prisma.category.create({ data: { name: "Investimentos", kind: "IN" } }),
    prisma.category.create({ data: { name: "Outros Recebimentos", kind: "IN" } }),

    // Categorias de Saída
    prisma.category.create({ data: { name: "Alimentação", kind: "OUT" } }),
    prisma.category.create({ data: { name: "Transporte", kind: "OUT" } }),
    prisma.category.create({ data: { name: "Moradia", kind: "OUT" } }),
    prisma.category.create({ data: { name: "Saúde", kind: "OUT" } }),
    prisma.category.create({ data: { name: "Educação", kind: "OUT" } }),
    prisma.category.create({ data: { name: "Lazer", kind: "OUT" } }),
    prisma.category.create({ data: { name: "Compras", kind: "OUT" } }),
    prisma.category.create({ data: { name: "Contas e Serviços", kind: "OUT" } }),

    // Categorias que podem ser ambas
    prisma.category.create({ data: { name: "Transferências", kind: "BOTH" } }),
  ]);

  // Criar Métodos de Pagamento
  console.log("Criando métodos de pagamento...");
  const paymentMethods = await Promise.all([
    prisma.paymentMethod.create({ data: { name: "Dinheiro" } }),
    prisma.paymentMethod.create({ data: { name: "Cartão de Crédito" } }),
    prisma.paymentMethod.create({ data: { name: "Cartão de Débito" } }),
    prisma.paymentMethod.create({ data: { name: "PIX" } }),
    prisma.paymentMethod.create({ data: { name: "Transferência Bancária" } }),
    prisma.paymentMethod.create({ data: { name: "Boleto" } }),
  ]);

  // Criar Contas
  console.log("Criando contas...");
  const accounts = await Promise.all([
    prisma.account.create({ data: { name: "Conta Corrente", type: "BANK" } }),
    prisma.account.create({ data: { name: "Poupança", type: "BANK" } }),
    prisma.account.create({ data: { name: "Carteira", type: "CASH" } }),
    prisma.account.create({ data: { name: "Nubank", type: "CREDIT_CARD" } }),
    prisma.account.create({ data: { name: "Investimentos", type: "INVESTMENT" } }),
  ]);

  // Criar Transações de Exemplo
  console.log("Criando transações de exemplo...");
  
  // Salário do mês
  await prisma.transaction.create({
    data: {
      direction: "IN",
      amountCents: 500000, // R$ 5.000,00
      issueDate: new Date("2026-01-05"),
      settlementDate: new Date("2026-01-05"),
      description: "Salário Janeiro/2026",
      categoryId: categories[0].id, // Salário
      paymentMethodId: paymentMethods[4].id, // Transferência Bancária
      accountId: accounts[0].id, // Conta Corrente
    },
  });

  // Freelance
  await prisma.transaction.create({
    data: {
      direction: "IN",
      amountCents: 150000, // R$ 1.500,00
      issueDate: new Date("2026-01-15"),
      settlementDate: new Date("2026-01-15"),
      description: "Projeto Website Cliente XYZ",
      categoryId: categories[1].id, // Freelance
      paymentMethodId: paymentMethods[3].id, // PIX
      accountId: accounts[0].id,
    },
  });

  // Despesas
  await prisma.transaction.create({
    data: {
      direction: "OUT",
      amountCents: 120000, // R$ 1.200,00
      issueDate: new Date("2026-01-10"),
      settlementDate: new Date("2026-01-10"),
      description: "Aluguel Janeiro",
      categoryId: categories[6].id, // Moradia
      paymentMethodId: paymentMethods[5].id, // Boleto
      accountId: accounts[0].id,
    },
  });

  await prisma.transaction.create({
    data: {
      direction: "OUT",
      amountCents: 8500, // R$ 85,00
      issueDate: new Date("2026-01-12"),
      settlementDate: new Date("2026-01-15"),
      description: "Supermercado",
      categoryId: categories[4].id, // Alimentação
      paymentMethodId: paymentMethods[1].id, // Cartão de Crédito
      accountId: accounts[3].id, // Nubank
    },
  });

  await prisma.transaction.create({
    data: {
      direction: "OUT",
      amountCents: 4500, // R$ 45,00
      issueDate: new Date("2026-01-13"),
      settlementDate: new Date("2026-01-13"),
      description: "Uber para o trabalho",
      categoryId: categories[5].id, // Transporte
      paymentMethodId: paymentMethods[2].id, // Cartão de Débito
      accountId: accounts[0].id,
    },
  });

  await prisma.transaction.create({
    data: {
      direction: "OUT",
      amountCents: 15000, // R$ 150,00
      issueDate: new Date("2026-01-14"),
      description: "Conta de Luz",
      categoryId: categories[11].id, // Contas e Serviços
      paymentMethodId: paymentMethods[5].id, // Boleto
      accountId: accounts[0].id,
    },
  });

  await prisma.transaction.create({
    data: {
      direction: "OUT",
      amountCents: 12000, // R$ 120,00
      issueDate: new Date("2026-01-16"),
      description: "Netflix + Spotify",
      categoryId: categories[9].id, // Lazer
      paymentMethodId: paymentMethods[1].id, // Cartão de Crédito
      accountId: accounts[3].id,
    },
  });

  await prisma.transaction.create({
    data: {
      direction: "OUT",
      amountCents: 25000, // R$ 250,00
      issueDate: new Date("2026-01-18"),
      settlementDate: new Date("2026-01-18"),
      description: "Compras roupa",
      notes: "Promoção de verão",
      categoryId: categories[10].id, // Compras
      paymentMethodId: paymentMethods[1].id, // Cartão de Crédito
      accountId: accounts[3].id,
    },
  });

  // Transferência para poupança
  await prisma.transaction.create({
    data: {
      direction: "OUT",
      amountCents: 100000, // R$ 1.000,00
      issueDate: new Date("2026-01-20"),
      settlementDate: new Date("2026-01-20"),
      description: "Transferência para Poupança",
      categoryId: categories[12].id, // Transferências
      paymentMethodId: paymentMethods[4].id, // Transferência Bancária
      accountId: accounts[0].id, // Saindo da Conta Corrente
    },
  });

  await prisma.transaction.create({
    data: {
      direction: "IN",
      amountCents: 100000, // R$ 1.000,00
      issueDate: new Date("2026-01-20"),
      settlementDate: new Date("2026-01-20"),
      description: "Transferência da Conta Corrente",
      categoryId: categories[12].id, // Transferências
      paymentMethodId: paymentMethods[4].id, // Transferência Bancária
      accountId: accounts[1].id, // Entrando na Poupança
    },
  });

  console.log("Seed concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error("Erro ao executar seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
