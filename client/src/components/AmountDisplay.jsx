import { formatCurrency } from '../utils/currency';

// storedRate: tasa guardada en el registro (usada para montos históricos)
// rates: tasa del día desde contexto (fallback cuando no hay tasa guardada)
const AmountDisplay = ({ amount, rates, storedRate, className = '' }) => {
  const n            = parseFloat(amount || 0);
  const effectiveRate = storedRate ? parseFloat(storedRate) : rates?.USD;
  const bsf          = effectiveRate && n > 0 ? n * effectiveRate : null;

  return (
    <div className={className}>
      <span>{formatCurrency(n, 'USD')}</span>
      {bsf !== null && (
        <div className="amount-equiv">
          {formatCurrency(bsf, 'BsF')}
        </div>
      )}
    </div>
  );
};

export default AmountDisplay;
