import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function formatCurrency(cents: number, locale: string = "pt-BR", currency: string = "BRL") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency
  }).format(cents / 100)
}

export function formatDate(date: Date | string, locale: string = "pt-BR") {
  return new Date(date).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric"
  })
}
