import { formatCurrency } from '../utils/currency';

const AmountDisplay = ({ amount, rates, className = '' }) => {
  const n   = parseFloat(amount || 0);
  const bsf = rates?.USD && n > 0 ? n * rates.USD : null;

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
