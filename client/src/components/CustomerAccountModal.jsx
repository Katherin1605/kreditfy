import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '../utils/currency';
import { useExchangeRates } from '../context/ExchangeRatesContext';
import AmountDisplay from './AmountDisplay';

const fmtCI = (v) => v ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '—';

const CustomerAccountModal = ({ show, customer, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { rates } = useExchangeRates();

  useEffect(() => {
    if (!show || !customer?.id) return;
    setData(null);
    setLoading(true);
    axios.get(`/customers/${customer.id}/account`)
      .then(res => setData(res.data))
      .catch(err => {
        toast.error(err.response?.data?.error || 'Error al cargar el estado de cuenta');
        onClose();
      })
      .finally(() => setLoading(false));
  }, [show, customer?.id]);

  if (!show) return null;

  const handlePrint = () => {
    const prev = document.title;
    document.title = `kreditfy-${data?.customer?.name || customer?.name || 'estado-de-cuenta'}`;
    window.print();
    document.title = prev;
  };

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1">
        <div className="modal-dialog modal-xl modal-dialog-scrollable">
          <div className="modal-content">

            <div className="modal-header no-print">
              <h5 className="modal-title">
                <i className="bi bi-file-text me-2"></i>
                Estado de Cuenta — {data?.customer?.name || customer?.name}
              </h5>
              <div className="d-flex gap-2 align-items-center ms-auto">
                {!loading && data && (
                  <button className="btn btn-sm btn-primary" onClick={handlePrint}>
                    <i className="bi bi-printer me-1"></i>Imprimir / PDF
                  </button>
                )}
                <button type="button" className="btn-close" onClick={onClose} />
              </div>
            </div>

            <div className="modal-body">
              {loading ? (
                <div className="text-center py-5 text-muted">
                  <div className="spinner-border text-primary mb-3" role="status" />
                  <p>Cargando estado de cuenta...</p>
                </div>
              ) : data && (
                <div className="account-statement-printable">

                  {/* Encabezado solo visible al imprimir */}
                  <div className="print-only account-statement-print-header mb-4">
                    <div>
                      <h4 className="fw-bold">Estado de Cuenta</h4>
                      <small>Historial de ventas y pagos</small>
                    </div>
                    <div className="text-end">
                      <small>Generado el {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</small>
                    </div>
                  </div>

                  {/* Datos del cliente */}
                  <div className="account-statement-customer-box mb-4">
                    <p className="account-statement-section-label">Datos del cliente</p>
                    <div className="row g-2">
                      <div className="col-6 col-md-3">
                        <span className="text-muted small">Nombre</span>
                        <p className="mb-0 fw-semibold">{data.customer.name}</p>
                      </div>
                      <div className="col-6 col-md-3">
                        <span className="text-muted small">Cédula</span>
                        <p className="mb-0">{fmtCI(data.customer.identity_card)}</p>
                      </div>
                      <div className="col-6 col-md-3">
                        <span className="text-muted small">Teléfono</span>
                        <p className="mb-0">{data.customer.phone || '—'}</p>
                      </div>
                      <div className="col-6 col-md-3">
                        <span className="text-muted small">Dirección</span>
                        <p className="mb-0">{data.customer.address || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Resumen */}
                  <div className="row g-3 mb-4">
                    <div className="col-4">
                      <div className="account-statement-summary-box account-statement-summary-ventas">
                        <p className="account-statement-summary-label">Total en ventas</p>
                        <p className="account-statement-summary-value">{formatCurrency(data.summary.totalVentas, 'USD')}</p>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="account-statement-summary-box account-statement-summary-cobrado">
                        <p className="account-statement-summary-label">Total cobrado</p>
                        <p className="account-statement-summary-value">{formatCurrency(data.summary.totalCobrado, 'USD')}</p>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className={`account-statement-summary-box ${data.summary.saldoPendiente > 0 ? 'account-statement-summary-pendiente' : 'account-statement-summary-cobrado'}`}>
                        <p className="account-statement-summary-label">Saldo pendiente</p>
                        <p className="account-statement-summary-value">{formatCurrency(data.summary.saldoPendiente, 'USD')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Lista de ventas */}
                  <p className="account-statement-section-label mb-3">Detalle de ventas</p>
                  {data.sales.length === 0 ? (
                    <p className="text-muted text-center py-3">Este cliente no tiene ventas registradas</p>
                  ) : (
                    data.sales.map((sale, idx) => (
                      <div key={sale.id} className={`account-statement-sale-block${idx < data.sales.length - 1 ? ' mb-4' : ''}`}>
                        <div className="account-statement-sale-header">
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            <span className="badge bg-light text-dark border">Venta #{sale.id}</span>
                            <span className="small text-muted">{formatDate(sale.sale_date)}</span>
                            <span className="fw-semibold">{formatCurrency(sale.total, 'USD')}</span>
                            <span className="small text-muted">· {sale.cuotas} cuota{sale.cuotas !== 1 ? 's' : ''} de {formatCurrency(sale.valor_cuota, 'USD')}</span>
                          </div>
                          <span className={`badge ${sale.status === 'paid' ? 'bg-success' : 'bg-warning text-dark'}`}>
                            {sale.status === 'paid' ? 'Pagado' : 'Pendiente'}
                          </span>
                        </div>

                        {sale.payments.length > 0 ? (
                          <table className="table table-sm mb-0 account-statement-payments-table">
                            <thead>
                              <tr>
                                <th>Fecha</th>
                                <th>Monto</th>
                                <th>Método</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sale.payments.map(p => (
                                <tr key={p.id}>
                                  <td className="text-muted">{formatDate(p.payment_date)}</td>
                                  <td>
                                    <AmountDisplay amount={p.amount} rates={rates} storedRate={p.exchange_rate} className="text-success fw-semibold" />
                                  </td>
                                  <td className="text-muted">{{ cash: 'Efectivo', transfer: 'Pago Móvil', card: 'Cobro Externo' }[p.method] || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p className="text-muted small px-3 py-2 mb-0">Sin pagos registrados</p>
                        )}

                        <div className="account-statement-sale-footer">
                          <span>Cobrado: <strong className="text-success">{formatCurrency(sale.total_paid, 'USD')}</strong></span>
                          <span>Saldo: <strong className={sale.balance > 0 ? 'text-warning' : 'text-success'}>{formatCurrency(sale.balance, 'USD')}</strong></span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show no-print" onClick={onClose} />
    </>
  );
};

export default CustomerAccountModal;
