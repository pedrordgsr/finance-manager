import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";
import bcrypt from "bcryptjs";

const connectionString = "file:./prisma/finance_db.db";
const adapter = new PrismaBetterSqlite3({ url: connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting database seed...");

  // Clear existing data
  await prisma.budget.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.category.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      name: "Demo User",
      email: "demo@finance.local",
      username: "demo",
      passwordHash: await bcrypt.hash("123456", 12),
    },
  });

  // Create Categories
  console.log("Creating categories...");
  const categories = await Promise.all([
    // Income Categories
    prisma.category.create({ data: { name: "Salary", kind: "IN", userId: user.id } }),
    prisma.category.create({ data: { name: "Freelance", kind: "IN", userId: user.id } }),
    prisma.category.create({ data: { name: "Investments", kind: "IN", userId: user.id } }),
    prisma.category.create({ data: { name: "Other Income", kind: "IN", userId: user.id } }),

    // Expense Categories
    prisma.category.create({ data: { name: "Food", kind: "OUT", userId: user.id } }),
    prisma.category.create({ data: { name: "Transportation", kind: "OUT", userId: user.id } }),
    prisma.category.create({ data: { name: "Housing", kind: "OUT", userId: user.id } }),
    prisma.category.create({ data: { name: "Health", kind: "OUT", userId: user.id } }),
    prisma.category.create({ data: { name: "Education", kind: "OUT", userId: user.id } }),
    prisma.category.create({ data: { name: "Entertainment", kind: "OUT", userId: user.id } }),
    prisma.category.create({ data: { name: "Shopping", kind: "OUT", userId: user.id } }),
    prisma.category.create({ data: { name: "Bills and Services", kind: "OUT", userId: user.id } }),

    // Categories that can be both
    prisma.category.create({ data: { name: "Transfers", kind: "BOTH", userId: user.id } }),
  ]);

  // Create Payment Methods
  console.log("Creating payment methods...");
  const paymentMethods = await Promise.all([
    prisma.paymentMethod.create({ data: { name: "Cash", userId: user.id } }),
    prisma.paymentMethod.create({ data: { name: "Credit Card", userId: user.id } }),
    prisma.paymentMethod.create({ data: { name: "Debit Card", userId: user.id } }),
    prisma.paymentMethod.create({ data: { name: "PIX", userId: user.id } }),
    prisma.paymentMethod.create({ data: { name: "Bank Transfer", userId: user.id } }),
    prisma.paymentMethod.create({ data: { name: "Boleto", userId: user.id } }),
  ]);

  // Create Accounts
  console.log("Creating accounts...");
  const accounts = await Promise.all([
    prisma.account.create({ data: { name: "Checking Account", type: "BANK", userId: user.id } }),
    prisma.account.create({ data: { name: "Savings", type: "BANK", userId: user.id } }),
    prisma.account.create({ data: { name: "Wallet", type: "CASH", userId: user.id } }),
    prisma.account.create({ data: { name: "Nubank", type: "CREDIT_CARD", userId: user.id } }),
    prisma.account.create({ data: { name: "Investments", type: "INVESTMENT", userId: user.id } }),
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
      userId: user.id,
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
      userId: user.id,
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
      userId: user.id,
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
      userId: user.id,
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
      userId: user.id,
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
      userId: user.id,
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
      userId: user.id,
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
      userId: user.id,
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
      userId: user.id,
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
      userId: user.id,
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
