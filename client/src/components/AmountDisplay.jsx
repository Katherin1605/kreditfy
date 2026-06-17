import { formatCurrency } from '../utils/currency';

const AmountDisplay = ({ amount, rates, className = '' }) => {
  const n = parseFloat(amount || 0);
  const usd = rates?.USD && n > 0 ? n / rates.USD : null;

  return (
    <div className={className}>
      <span>{formatCurrency(n, 'BsF')}</span>
      {usd !== null && (
        <div className="amount-equiv">
          {formatCurrency(usd, 'USD')}
        </div>
      )}
    </div>
  );
};

export default AmountDisplay;
