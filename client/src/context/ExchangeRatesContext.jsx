import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const ExchangeRatesContext = createContext({ rates: { USD: null, EUR: null }, updatedAt: null });

export const ExchangeRatesProvider = ({ children }) => {
  const [rates, setRates]       = useState({ USD: null, EUR: null });
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    axios.get('/exchange-rates')
      .then(res => {
        setRates({ USD: res.data.USD, EUR: res.data.EUR });
        setUpdatedAt(res.data.updatedAt);
      })
      .catch(() => {}); // las tasas son opcionales; si fallan la app sigue funcionando
  }, []);

  return (
    <ExchangeRatesContext.Provider value={{ rates, updatedAt }}>
      {children}
    </ExchangeRatesContext.Provider>
  );
};

export const useExchangeRates = () => useContext(ExchangeRatesContext);
