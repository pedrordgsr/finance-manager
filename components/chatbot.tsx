"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();
      setMessages((prev) => [...prev, data]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Desculpe, ocorreu um erro ao processar sua pergunta." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="bg-background border rounded-lg shadow-xl w-[350px] sm:w-[450px] h-[600px] flex flex-col mb-4 overflow-hidden animate-in slide-in-from-bottom-2">
          {/* Header */}
          <div className="p-4 border-b bg-primary flex justify-between items-center text-primary-foreground">
            <div className="flex items-center gap-2 font-semibold">
              <Bot size={20} />
              <span>Assistente Financeiro</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-primary-foreground/10 text-primary-foreground"
              onClick={() => setIsOpen(false)}
            >
              <X size={20} />
            </Button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30"
          >
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground mt-10 space-y-2 px-4">
                <Bot className="mx-auto text-primary" size={40} />
                <p className="font-medium text-foreground">Olá! Sou seu assistente de finanças.</p>
                <p className="text-sm">Posso analisar seus gastos e dar dicas de economia. O que deseja saber hoje?</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-2 w-full",
                  msg.role === "user" ? "flex-row-reverse" : ""
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border",
                    msg.role === "assistant" ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}
                >
                  {msg.role === "assistant" ? <Bot size={14} /> : <User size={14} />}
                </div>
                <div
                  className={cn(
                    "p-3 rounded-2xl text-sm shadow-sm max-w-[85%]",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-card border rounded-tl-none prose prose-sm dark:prose-invert"
                  )}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose-p:leading-relaxed prose-pre:bg-muted prose-pre:p-2 prose-pre:rounded-md prose-table:border prose-table:w-full prose-th:border prose-th:p-1 prose-td:border prose-td:p-1">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                        </ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-2 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 border">
                  <Bot size={14} />
                </div>
                <div className="p-3 rounded-2xl bg-card border rounded-tl-none shadow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"></span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t bg-background">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pergunte algo sobre suas finanças..."
                className="flex-1 bg-muted rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className="rounded-full shrink-0"
              >
                <Send size={18} />
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="icon"
        className={cn(
          "w-14 h-14 rounded-full shadow-lg transition-transform hover:scale-110",
          isOpen ? "bg-muted text-foreground hover:bg-muted" : "bg-primary text-primary-foreground"
        )}
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
      </Button>
    </div>
  );
}
