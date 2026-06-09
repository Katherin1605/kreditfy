import { useState, useEffect } from 'react';
import axios from 'axios';

const Payments = () => {
  const [sales, setSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [saleDetail, setSaleDetail] = useState(null);
  const [payments, setPayments] = useState([]);
  const [showPayForm, setShowPayForm] = useState(false);
  const [payForm, setPayForm] = useState({ amount: '', method: '' });

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = () => {
    axios.get('http://localhost:3000/sales')
      .then(res => setSales(res.data))
      .catch(err => alert(err.response?.data?.error || 'Error al cargar las ventas'));
  };

  const handleSelectSale = (sale) => {
    setSelectedSale(sale);
    setShowPayForm(false);
    setPayForm({ amount: '', method: '' });
    Promise.all([
      axios.get(`http://localhost:3000/sales/${sale.id}`),
      axios.get(`http://localhost:3000/payments/sale/${sale.id}`)
    ])
      .then(([detailRes, paymentsRes]) => {
        setSaleDetail(detailRes.data);
        setPayments(paymentsRes.data);
      })
      .catch(err => alert(err.response?.data?.error || 'Error al cargar el detalle'));
  };

  const handleCloseDetail = () => {
    setSelectedSale(null);
    setSaleDetail(null);
    setPayments([]);
    setShowPayForm(false);
  };

  const handleSubmitPago = (e) => {
    e.preventDefault();
    const amount = parseFloat(payForm.amount);
    const balance = parseFloat(selectedSale.balance);
    if (amount <= 0 || amount > balance) {
      alert('El monto debe ser mayor a 0 y no puede superar el saldo pendiente');
      return;
    }
    const body = {
      sale_id: selectedSale.id,
      amount,
      ...(payForm.method ? { method: payForm.method } : {})
    };
    axios.post('http://localhost:3000/payments', body)
      .then(() => Promise.all([
        axios.get(`http://localhost:3000/sales/${selectedSale.id}`),
        axios.get(`http://localhost:3000/payments/sale/${selectedSale.id}`)
      ]))
      .then(([detailRes, paymentsRes]) => {
        loadSales();
        setSaleDetail(detailRes.data);
        setPayments(paymentsRes.data);
        setSelectedSale(detailRes.data);
        setShowPayForm(false);
        setPayForm({ amount: '', method: '' });
        if (parseFloat(detailRes.data.balance) <= 0) handleCloseDetail();
      })
      .catch(err => alert(err.response?.data?.error || 'Error al registrar el pago'));
  };

  const pendingSales = sales.filter(s => s.status !== 'paid');

  const getCuotasPagadas = (sale) => {
    const valorCuota = parseFloat(sale.valor_cuota);
    if (!valorCuota) return 0;
    return Math.floor(parseFloat(sale.total_paid) / valorCuota);
  };

  return (
    <>
      <h5 className="mb-4">Control de Pagos</h5>
      <div className="row g-4">

        <div className="col-lg-5">
          <div className="card">
            <div className="card-header" style={{ backgroundColor: 'var(--bg-section)' }}>
              <strong>Ventas Pendientes</strong>
            </div>
            <div className="card-body p-3">
              {pendingSales.length === 0 ? (
                <p className="text-muted text-center py-4">No hay ventas pendientes</p>
              ) : (
                pendingSales.map(s => (
                  <div
                    key={s.id}
                    className="card mb-3"
                    style={{ cursor: 'pointer', border: selectedSale?.id === s.id ? '2px solid var(--primary-color)' : '' }}
                    onClick={() => handleSelectSale(s)}
                  >
                    <div className="card-body py-2">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-0">{s.customer_name}</h6>
                          <small className="text-muted">{new Date(s.created_at).toLocaleDateString()}</small>
                        </div>
                        <i className="bi bi-eye text-primary fs-5"></i>
                      </div>
                      <div className="d-flex justify-content-between mt-2 small">
                        <span>Total: <strong>${parseFloat(s.total).toFixed(2)}</strong></span>
                        <span className="text-muted">{getCuotasPagadas(s)}/{s.cuotas} cuotas</span>
                        <span className="text-warning fw-bold">Saldo: ${parseFloat(s.balance).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          {selectedSale ? (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center" style={{ backgroundColor: 'var(--bg-section)' }}>
                <strong>Detalle de Venta</strong>
                <button type="button" className="btn-close" onClick={handleCloseDetail} />
              </div>
              <div className="card-body">

                <div className="row mb-2">
                  <div className="col-6">
                    <p className="text-muted mb-0 small">Cliente</p>
                    <p className="fw-bold mb-0">{selectedSale.customer_name}</p>
                  </div>
                  <div className="col-6">
                    <p className="text-muted mb-0 small">Fecha</p>
                    <p className="mb-0">{new Date(selectedSale.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <hr />
                <p className="text-muted small mb-2">Productos vendidos</p>
                {saleDetail?.details?.map(d => (
                  <div key={d.id} className="d-flex justify-content-between small mb-1">
                    <span>{d.product_name} × {d.quantity}</span>
                    <span>${(d.quantity * parseFloat(d.price)).toFixed(2)}</span>
                  </div>
                ))}

                <hr />
                <div className="d-flex justify-content-between mb-1">
                  <span>Total</span>
                  <strong>${parseFloat(selectedSale.total).toFixed(2)}</strong>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted small">Cuotas</span>
                  <span className="small">
                    {getCuotasPagadas(selectedSale)}/{selectedSale.cuotas} pagadas
                    &nbsp;·&nbsp;
                    ${parseFloat(selectedSale.valor_cuota || 0).toFixed(2)}/c.
                  </span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted small">Cuotas restantes</span>
                  <span className="small">{selectedSale.cuotas - getCuotasPagadas(selectedSale)}</span>
                </div>
                <div className="d-flex justify-content-between mb-1 text-success">
                  <span>Pagado</span>
                  <span>${parseFloat(selectedSale.total_paid).toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between fw-bold text-warning">
                  <span>Saldo pendiente</span>
                  <span>${parseFloat(selectedSale.balance).toFixed(2)}</span>
                </div>

                {payments.length > 0 && (
                  <>
                    <hr />
                    <p className="text-muted small mb-2">Historial de pagos</p>
                    {payments.map(p => (
                      <div key={p.id} className="bg-light rounded p-2 mb-2">
                        <div className="d-flex justify-content-between">
                          <span className="text-success fw-bold">${parseFloat(p.amount).toFixed(2)}</span>
                          <small className="text-muted">{new Date(p.payment_date).toLocaleDateString()}</small>
                        </div>
                        {p.method && (
                          <small className="text-muted">
                            Método: {{ cash: 'Efectivo', transfer: 'Transferencia', card: 'Tarjeta' }[p.method] || p.method}
                          </small>
                        )}
                      </div>
                    ))}
                  </>
                )}

                {parseFloat(selectedSale.balance) > 0 && (
                  <>
                    {!showPayForm ? (
                      <button className="btn btn-success w-100 mt-3" onClick={() => setShowPayForm(true)}>
                        <i className="bi bi-cash-coin me-2"></i>Registrar Pago
                      </button>
                    ) : (
                      <form onSubmit={handleSubmitPago} className="mt-3">
                        <hr />
                        <p className="fw-bold mb-3">Nuevo Pago</p>
                        <div className="mb-3">
                          <label className="form-label">Monto *</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            className="form-control"
                            value={payForm.amount}
                            onChange={e => setPayForm({ ...payForm, amount: e.target.value })}
                            placeholder={`Sugerido: $${parseFloat(selectedSale.valor_cuota || 0).toFixed(2)} · Máx: $${parseFloat(selectedSale.balance).toFixed(2)}`}
                            required
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
