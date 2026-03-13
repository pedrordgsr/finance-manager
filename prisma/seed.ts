import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = "file:./prisma/finance_db.db";
const adapter = new PrismaBetterSqlite3({ url: connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting database seed...");

  // Clear existing data
  await prisma.transaction.deleteMany();
  await prisma.category.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.account.deleteMany();

  // Create Categories
  console.log("Creating categories...");
  const categories = await Promise.all([
    // Income Categories
    prisma.category.create({ data: { name: "Salary", kind: "IN" } }),
    prisma.category.create({ data: { name: "Freelance", kind: "IN" } }),
    prisma.category.create({ data: { name: "Investments", kind: "IN" } }),
    prisma.category.create({ data: { name: "Other Income", kind: "IN" } }),

    // Expense Categories
    prisma.category.create({ data: { name: "Food", kind: "OUT" } }),
    prisma.category.create({ data: { name: "Transportation", kind: "OUT" } }),
    prisma.category.create({ data: { name: "Housing", kind: "OUT" } }),
    prisma.category.create({ data: { name: "Health", kind: "OUT" } }),
    prisma.category.create({ data: { name: "Education", kind: "OUT" } }),
    prisma.category.create({ data: { name: "Entertainment", kind: "OUT" } }),
    prisma.category.create({ data: { name: "Shopping", kind: "OUT" } }),
    prisma.category.create({ data: { name: "Bills and Services", kind: "OUT" } }),

    // Categories that can be both
    prisma.category.create({ data: { name: "Transfers", kind: "BOTH" } }),
  ]);

  // Create Payment Methods
  console.log("Creating payment methods...");
  const paymentMethods = await Promise.all([
    prisma.paymentMethod.create({ data: { name: "Cash" } }),
    prisma.paymentMethod.create({ data: { name: "Credit Card" } }),
    prisma.paymentMethod.create({ data: { name: "Debit Card" } }),
    prisma.paymentMethod.create({ data: { name: "PIX" } }),
    prisma.paymentMethod.create({ data: { name: "Bank Transfer" } }),
    prisma.paymentMethod.create({ data: { name: "Boleto" } }),
  ]);

  // Create Accounts
  console.log("Creating accounts...");
  const accounts = await Promise.all([
    prisma.account.create({ data: { name: "Checking Account", type: "BANK" } }),
    prisma.account.create({ data: { name: "Savings", type: "BANK" } }),
    prisma.account.create({ data: { name: "Wallet", type: "CASH" } }),
    prisma.account.create({ data: { name: "Nubank", type: "CREDIT_CARD" } }),
    prisma.account.create({ data: { name: "Investments", type: "INVESTMENT" } }),
  ]);

  // Create Example Transactions
  console.log("Creating example transactions...");

  // Monthly Salary
  await prisma.transaction.create({
    data: {
      direction: "IN",
      amountCents: 500000, // $5,000.00
      issueDate: new Date("2026-01-05"),
      settlementDate: new Date("2026-01-05"),
      description: "January 2026 Salary",
      categoryId: categories[0].id, // Salary
      paymentMethodId: paymentMethods[4].id, // Bank Transfer
      accountId: accounts[0].id, // Checking Account
    },
  });

  // Freelance
  await prisma.transaction.create({
    data: {
      direction: "IN",
      amountCents: 150000, // $1,500.00
      issueDate: new Date("2026-01-15"),
      settlementDate: new Date("2026-01-15"),
      description: "Website Project for Client XYZ",
      categoryId: categories[1].id, // Freelance
      paymentMethodId: paymentMethods[3].id, // PIX
      accountId: accounts[0].id,
    },
  });

  // Expenses
  await prisma.transaction.create({
    data: {
      direction: "OUT",
      amountCents: 120000, // $1,200.00
      issueDate: new Date("2026-01-10"),
      settlementDate: new Date("2026-01-10"),
      description: "January Rent",
      categoryId: categories[6].id, // Housing
      paymentMethodId: paymentMethods[5].id, // Boleto
      accountId: accounts[0].id,
    },
  });

  await prisma.transaction.create({
    data: {
      direction: "OUT",
      amountCents: 8500, // $85.00
      issueDate: new Date("2026-01-12"),
      settlementDate: new Date("2026-01-15"),
      description: "Groceries",
      categoryId: categories[4].id, // Food
      paymentMethodId: paymentMethods[1].id, // Credit Card
      accountId: accounts[3].id, // Nubank
    },
  });

  await prisma.transaction.create({
    data: {
      direction: "OUT",
      amountCents: 4500, // $45.00
      issueDate: new Date("2026-01-13"),
      settlementDate: new Date("2026-01-13"),
      description: "Uber to work",
      categoryId: categories[5].id, // Transportation
      paymentMethodId: paymentMethods[2].id, // Debit Card
      accountId: accounts[0].id,
    },
  });

  await prisma.transaction.create({
    data: {
      direction: "OUT",
      amountCents: 15000, // $150.00
      issueDate: new Date("2026-01-14"),
      description: "Electricity Bill",
      categoryId: categories[11].id, // Bills and Services
      paymentMethodId: paymentMethods[5].id, // Boleto
      accountId: accounts[0].id,
    },
  });

  await prisma.transaction.create({
    data: {
      direction: "OUT",
      amountCents: 12000, // $120.00
      issueDate: new Date("2026-01-16"),
      description: "Netflix + Spotify",
      categoryId: categories[9].id, // Entertainment
      paymentMethodId: paymentMethods[1].id, // Credit Card
      accountId: accounts[3].id,
    },
  });

  await prisma.transaction.create({
    data: {
      direction: "OUT",
      amountCents: 25000, // $250.00
      issueDate: new Date("2026-01-18"),
      settlementDate: new Date("2026-01-18"),
      description: "Clothing Shopping",
      notes: "Summer Sale",
      categoryId: categories[10].id, // Shopping
      paymentMethodId: paymentMethods[1].id, // Credit Card
      accountId: accounts[3].id,
    },
  });

  // Transfer to Savings
  await prisma.transaction.create({
    data: {
      direction: "OUT",
      amountCents: 100000, // $1,000.00
      issueDate: new Date("2026-01-20"),
      settlementDate: new Date("2026-01-20"),
      description: "Transfer to Savings",
      categoryId: categories[12].id, // Transfers
      paymentMethodId: paymentMethods[4].id, // Bank Transfer
      accountId: accounts[0].id, // From Checking Account
    },
  });

  await prisma.transaction.create({
    data: {
      direction: "IN",
      amountCents: 100000, // $1,000.00
      issueDate: new Date("2026-01-20"),
      settlementDate: new Date("2026-01-20"),
      description: "Transfer from Checking Account",
      categoryId: categories[12].id, // Transfers
      paymentMethodId: paymentMethods[4].id, // Bank Transfer
      accountId: accounts[1].id, // To Savings
    },
  });

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error running seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
