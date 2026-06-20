import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/currency';
import { useExchangeRates } from '../context/ExchangeRatesContext';
import AmountDisplay from '../components/AmountDisplay';
import useConfirm from '../hooks/useConfirm';

const OVERDUE_DAYS = 30;

const isOverdue = (sale) => {
  const ref = sale.last_payment_date
    ? new Date(sale.last_payment_date)
    : new Date(sale.sale_date || sale.created_at);
  const days = (Date.now() - ref.getTime()) / (1000 * 60 * 60 * 24);
  return days > OVERDUE_DAYS;
};

const METHOD_LABELS = { cash: 'Efectivo', transfer: 'Transferencia', card: 'Tarjeta' };

const Payments = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);
  const [saleDetail, setSaleDetail] = useState(null);
  const [payments, setPayments] = useState([]);
  const [showPayForm, setShowPayForm] = useState(false);
  const [payForm, setPayForm] = useState({ amount: '', method: '', payment_date: new Date().toISOString().split('T')[0] });
  const { confirmModal } = useConfirm();
  const { rates } = useExchangeRates();

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = () => {
    setLoading(true);
    axios.get('http://localhost:3000/sales', { params: { limit: 500 } })
      .then(res => {
        const data = res.data;
        setSales(Array.isArray(data) ? data : (data.data || []));
      })
      .catch(err => toast.error(err.response?.data?.error || 'Error al cargar las ventas'))
      .finally(() => setLoading(false));
  };

  const handleSelectSale = (sale) => {
    setSelectedSale(sale);
    setShowPayForm(false);
    setPayForm({ amount: '', method: '', payment_date: new Date().toISOString().split('T')[0] });
    Promise.all([
      axios.get(`http://localhost:3000/sales/${sale.id}`),
      axios.get(`http://localhost:3000/payments/sale/${sale.id}`)
    ])
      .then(([detailRes, paymentsRes]) => {
        setSaleDetail(detailRes.data);
        setPayments(paymentsRes.data);
      })
      .catch(err => toast.error(err.response?.data?.error || 'Error al cargar el detalle'));
  };

  const handleCloseDetail = () => {
    setSelectedSale(null);
    setSaleDetail(null);
    setPayments([]);
    setShowPayForm(false);
  };

  const handleSubmitPago = (e) => {
    e.preventDefault();
    const amount = parseFloat(payForm.amount.replace(/,/g, ''));
    const balance = parseFloat(selectedSale.balance);
    if (amount <= 0 || amount > balance) {
      toast.error('El monto debe ser mayor a 0 y no puede superar el saldo pendiente');
      return;
    }
    const body = {
      sale_id: selectedSale.id,
      amount,
      payment_date: payForm.payment_date || new Date().toISOString().split('T')[0],
      ...(payForm.method ? { method: payForm.method } : {})
    };
    axios.post('http://localhost:3000/payments', body)
      .then(() => Promise.all([
        axios.get(`http://localhost:3000/sales/${selectedSale.id}`),
        axios.get(`http://localhost:3000/payments/sale/${selectedSale.id}`)
      ]))
      .then(([detailRes, paymentsRes]) => {
        toast.success('Pago registrado');
        loadSales();
        setSaleDetail(detailRes.data);
        setPayments(paymentsRes.data);
        setSelectedSale(prev => ({ ...prev, ...detailRes.data }));
        setShowPayForm(false);
        setPayForm({ amount: '', method: '', payment_date: new Date().toISOString().split('T')[0] });
        if (parseFloat(detailRes.data.balance) <= 0) handleCloseDetail();
      })
      .catch(err => toast.error(err.response?.data?.error || 'Error al registrar el pago'));
  };

  const pendingSales = sales.filter(s => s.status !== 'paid');

  const getCuotasPagadas = (sale) => {
    const valorCuota = parseFloat(sale.valor_cuota);
    if (!valorCuota) return 0;
    return Math.floor(parseFloat(sale.total_paid) / valorCuota);
  };

  const getProgressColor = (pct) => {
    if (pct >= 70) return 'bg-success';
    if (pct >= 30) return 'bg-warning';
    return 'bg-danger';
  };

  return (
    <>
      {confirmModal}
      <h5 className="mb-4">Control de Pagos</h5>
      <div className="row g-4">

        <div className="col-lg-5">
          <div className="card">
            <div className="card-header dashboard-card-header">
              <strong>Ventas Pendientes</strong>
            </div>
            <div className="card-body p-3">
              {loading ? (
                <div className="d-flex flex-column gap-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="skeleton-card skeleton-sale-card"></div>
                  ))}
                </div>
              ) : pendingSales.length === 0 ? (
                <p className="text-muted text-center py-4">No hay ventas pendientes</p>
              ) : (
                pendingSales.map(s => {
                  const overdue = isOverdue(s);
                  const cuotasPagadas = getCuotasPagadas(s);
                  const pct = s.cuotas > 0 ? Math.round((cuotasPagadas / s.cuotas) * 100) : 0;
                  return (
                    <div
                      key={s.id}
                      className={`card mb-3 payment-sale-card ${selectedSale?.id === s.id ? 'payment-sale-card--active' : ''}`}
                      onClick={() => handleSelectSale(s)}
                    >
                      <div className="card-body py-2">
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="d-flex align-items-center gap-2">
                            <h6 className="mb-0">{s.customer_name}</h6>
                            {overdue && (
                              <span className="badge bg-danger">Vencida</span>
                            )}
                          </div>
                          <i className="bi bi-eye text-primary fs-5"></i>
                        </div>
                        <small className="text-muted">{new Date(s.sale_date || s.created_at).toLocaleDateString('es-ES')}</small>
                        <div className="d-flex justify-content-between mt-2 mb-1 small">
                          <span>Total: <strong><AmountDisplay amount={s.total} rates={rates} /></strong></span>
                          <span className="text-muted">{cuotasPagadas}/{s.cuotas} cuotas</span>
                          <span className="text-warning fw-bold">Saldo: <AmountDisplay amount={s.balance} rates={rates} /></span>
                        </div>
                        <div className="progress" style={{ height: '5px' }}>
                          <div
                            className={`progress-bar ${getProgressColor(pct)}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          {selectedSale ? (
            <div className="card">
              <div className="card-header dashboard-card-header d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                  <strong>Detalle de Venta</strong>
                  {isOverdue(selectedSale) && (
                    <span className="badge bg-danger">Vencida</span>
                  )}
                </div>
                <button type="button" className="btn-close" onClick={handleCloseDetail} />
              </div>
              <div className="card-body">

                <div className="row mb-2">
                  <div className="col-6">
                    <p className="text-muted mb-0 small">Cliente</p>
                    <p className="fw-bold mb-0">{selectedSale.customer_name}</p>
                  </div>
                  <div className="col-4">
                    <p className="text-muted mb-0 small">Fecha</p>
                    <p className="mb-0">{new Date(selectedSale.sale_date || selectedSale.created_at).toLocaleDateString('es-ES')}</p>
                  </div>
                  <div className="col-2">
                    <p className="text-muted mb-0 small">Moneda</p>
                    <span className="badge bg-light text-dark border">USD</span>
                  </div>
                </div>

                <hr />
                <p className="text-muted small mb-2">Productos vendidos</p>
                {saleDetail?.details?.map(d => (
                  <div key={d.id} className="d-flex justify-content-between small mb-1">
                    <span>{d.product_name} × {d.quantity}</span>
                    <AmountDisplay amount={d.quantity * parseFloat(d.price)} rates={rates} />
                  </div>
                ))}

                <hr />
                <div className="d-flex justify-content-between mb-1">
                  <span>Total</span>
                  <strong><AmountDisplay amount={selectedSale.total} rates={rates} /></strong>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted small">Cuotas</span>
                  <span className="small">
                    {getCuotasPagadas(selectedSale)}/{selectedSale.cuotas} pagadas
                    &nbsp;·&nbsp;
                    {formatCurrency(selectedSale.valor_cuota || 0, 'USD')}/c.
                  </span>
                </div>

                {selectedSale.cuotas > 1 && (() => {
                  const cuotasPagadas = getCuotasPagadas(selectedSale);
                  const pct = Math.round((cuotasPagadas / selectedSale.cuotas) * 100);
                  return (
                    <div className="mb-2">
                      <div className="d-flex justify-content-between small text-muted mb-1">
                        <span>Progreso de cuotas</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="progress" style={{ height: '8px' }}>
                        <div
                          className={`progress-bar ${getProgressColor(pct)}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}

                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted small">Cuotas restantes</span>
                  <span className="small">{selectedSale.cuotas - getCuotasPagadas(selectedSale)}</span>
                </div>
                <div className="d-flex justify-content-between mb-1 text-success">
                  <span>Pagado</span>
                  <AmountDisplay amount={selectedSale.total_paid} rates={rates} />
                </div>
                <div className="d-flex justify-content-between fw-bold text-warning">
                  <span>Saldo pendiente</span>
                  <AmountDisplay amount={selectedSale.balance} rates={rates} />
                </div>

                {payments.length > 0 && (
                  <>
                    <hr />
                    <p className="text-muted small mb-2">Historial de pagos</p>
                    <div className="table-responsive">
                      <table className="table table-sm table-hover mb-0">
                        <thead className="table-light">
                          <tr>
                            <th className="small">Fecha</th>
                            <th className="small">Monto</th>
                            <th className="small">Método</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map(p => (
                            <tr key={p.id}>
                              <td className="small text-muted">
                                {new Date(p.payment_date || p.created_at).toLocaleDateString('es-ES')}
                              </td>
                              <td>
                                <AmountDisplay amount={p.amount} rates={rates} className="text-success fw-bold small" />
                              </td>
                              <td className="small text-muted">
                                {METHOD_LABELS[p.method] || p.method || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {parseFloat(selectedSale.balance) > 0 && (
                  <>
                    {!showPayForm ? (
                      <button className="btn btn-success w-100 mt-3" onClick={() => setShowPayForm(true)}>
                        <i className="bi bi-cash-coin me-2"></i>Registrar Pago
                      </button>
                    ) : (
                      <form onSubmit={handleSubmitPago} className="mt-3" noValidate>
                        <hr />
                        <p className="fw-bold mb-3">Nuevo Pago</p>
                        <div className="mb-3">
                          <label className="form-label">Monto *</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            className="form-control"
                            value={payForm.amount}
                            onChange={e => {
                              const raw = e.target.value.replace(/,/g, '').replace(/[^0-9.]/g, '');
                              setPayForm({ ...payForm, amount: raw });
                            }}
                            onBlur={() => {
                              const num = parseFloat(payForm.amount);
                              if (!isNaN(num) && num > 0) {
                                const [int, dec = '00'] = num.toFixed(2).split('.');
                                const formatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + dec;
                                setPayForm({ ...payForm, amount: formatted });
                              }
                            }}
                            onFocus={e => {
                              const raw = payForm.amount.replace(/,/g, '');
                              setPayForm({ ...payForm, amount: raw });
                              e.target.select();
                            }}
                            placeholder={`Sugerido: ${formatCurrency(selectedSale.valor_cuota || 0, 'USD')} · Máx: ${formatCurrency(selectedSale.balance, 'USD')}`}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Fecha de pago *</label>
                          <input
                            type="date"
                            className="form-control"
                            value={payForm.payment_date}
                            onChange={e => setPayForm({ ...payForm, payment_date: e.target.value })}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Método de pago</label>
                          <select
                            className="form-select"
                            value={payForm.method}
                            onChange={e => setPayForm({ ...payForm, method: e.target.value })}
                          >
                            <option value="">Sin especificar</option>
                            <option value="cash">Efectivo</option>
                            <option value="transfer">Transferencia</option>
                            <option value="card">Tarjeta</option>
                          </select>
                        </div>
                        <div className="d-flex gap-2">
                          <button type="submit" className="btn btn-success flex-fill">Guardar Pago</button>
                          <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPayForm(false)}>Cancelar</button>
                        </div>
                      </form>
                    )}
                  </>
                )}

              </div>
            </div>
          ) : (
            <div className="text-center text-muted mt-5">
              <i className="bi bi-credit-card fs-1 d-block mb-3"></i>
              <p>Selecciona una venta para ver el detalle y registrar pagos</p>
            </div>
          )}
        </div>

      </div>
    </>
  );
};

export default Payments;
