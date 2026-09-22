export const CURRENCIES = [
  { code: 'USD', label: 'USD — Dólar',    symbol: '$'   },
  { code: 'EUR', label: 'EUR — Euro',     symbol: '€'   },
  { code: 'BsF', label: 'BsF — Bolívar', symbol: 'Bs.' },
];

const withThousands = (n) => {
  const [int, dec] = parseFloat(n || 0).toFixed(2).split('.');
  return int.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + dec;
};

export const formatCurrency = (amount, currency = 'USD') => {
  const formatted = withThousands(amount);
  if (currency === 'EUR') return `€${formatted}`;
  if (currency === 'BsF') return `Bs. ${formatted}`;
  return `$${formatted}`;
};

export const currencySymbol = (currency = 'USD') => {
  const found = CURRENCIES.find(c => c.code === currency);
  return found ? found.symbol : '$';
};

// Parsea solo la parte YYYY-MM-DD para evitar el desfase UTC→local
export const formatDate = (dateStr, opts = { day: '2-digit', month: '2-digit', year: 'numeric' }) => {
  if (!dateStr) return '—';
  const [y, m, d] = String(dateStr).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-ES', opts);
};
