export function formatCurrency(value: number | string | undefined | null): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (num === undefined || num === null || isNaN(num)) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num)
}

export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d)
  } catch {
    return dateStr
  }
}

export function formatDateTime(dateStr: string | undefined | null): string {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  } catch {
    return dateStr
  }
}

export function formatCNPJ(val: string | undefined | null): string {
  if (!val) return ''
  const clean = val.replace(/\D/g, '')
  if (clean.length === 14) {
    return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
  }
  if (clean.length === 11) {
    return clean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
  }
  return val
}

export function formatPhone(val: string | undefined | null): string {
  if (!val) return ''
  const clean = val.replace(/\D/g, '')
  if (clean.length === 13 && clean.startsWith('55')) {
    const ddd = clean.slice(2, 4)
    const num = clean.slice(4)
    return `+55 (${ddd}) ${num.slice(0, 5)}-${num.slice(5)}`
  }
  if (clean.length === 11) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`
  }
  return val
}
