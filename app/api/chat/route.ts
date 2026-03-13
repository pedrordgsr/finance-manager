import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    // Fetch recent transactions for context
    const transactions = await prisma.transaction.findMany({
      take: 20,
      orderBy: { issueDate: "desc" },
      include: {
        category: true,
        account: true,
      },
    });

    const context = transactions.map(t => ({
      date: t.issueDate.toISOString().split('T')[0],
      amount: (t.amountCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      description: t.description,
      category: t.category.name,
      direction: t.direction === 'IN' ? 'Entrada' : 'Saída',
      account: t.account?.name || 'N/A'
    }));

    const systemPrompt = `Você é um assistente financeiro pessoal especializado em analisar lançamentos e dar dicas de economia.
Recicle as informações das transações recentes do usuário para fornecer respostas precisas e personalizadas.
Transações recentes: ${JSON.stringify(context, null, 2)}

Responda de forma amigável, clara e objetiva em Português.
Se o usuário perguntar algo fora do contexto financeiro, tente gentilmente trazer o assunto de volta para finanças.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m: any) => ({
          role: m.role,
          content: m.content,
        })),
      ],
    });

    const reply = response.choices[0]?.message;

    return NextResponse.json(reply);
  } catch (error) {
    console.error("OpenAI Chat API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
