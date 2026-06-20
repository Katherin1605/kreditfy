import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import AmountDisplay from '../components/AmountDisplay';
import { useExchangeRates } from '../context/ExchangeRatesContext';

const Earnings = () => {
  const currentYear = new Date().getFullYear();
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ show: false, month: null, notas: '', cerrado: false });
  const [saving, setSaving] = useState(false);
  const { rates } = useExchangeRates();

  useEffect(() => {
    axios.get('http://localhost:3000/earnings/years')
      .then(res => {
        const list = res.data;
        const withCurrent = list.includes(currentYear) ? list : [currentYear, ...list];
        setYears(withCurrent);
        if (list.length > 0 && !list.includes(currentYear)) {
          setSelectedYear(list[0]);
        }
      })
      .catch(() => setYears([currentYear]));
  }, []);

  useEffect(() => {
    loadEarnings(selectedYear);
  }, [selectedYear]);

  const loadEarnings = (year) => {
    setLoading(true);
    axios.get('http://localhost:3000/earnings/monthly', { params: { year, currency: 'USD' } })
      .then(res => setRows(res.data))
      .catch(err => toast.error(err.response?.data?.error || 'Error al cargar cobros'))
      .finally(() => setLoading(false));
  };

  const openModal = (row) => {
    setModal({ show: true, month: row.month, notas: row.notas || '', cerrado: !!row.cerrado });
  };

  const closeModal = () => {
    setModal({ show: false, month: null, notas: '', cerrado: false });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`http://localhost:3000/earnings/${selectedYear}/${modal.month}`, {
        notas: modal.notas,
        cerrado: modal.cerrado,
      });
      toast.success('Cierre guardado');
      closeModal();
      loadEarnings(selectedYear);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const totals = rows.reduce(
    (acc, r) => ({
      ingresos: acc.ingresos + parseFloat(r.ingresos || 0),
      gastos:   acc.gastos   + parseFloat(r.gastos   || 0),
      ganancia: acc.ganancia + parseFloat(r.ganancia  || 0),
      socio_1:  acc.socio_1  + parseFloat(r.socio_1   || 0),
      socio_2:  acc.socio_2  + parseFloat(r.socio_2   || 0),
    }),
    { ingresos: 0, gastos: 0, ganancia: 0, socio_1: 0, socio_2: 0 }
  );

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="mb-0">Cobros Mensuales</h5>
          <small className="text-muted">Resumen financiero por mes</small>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <label className="form-label mb-0 text-muted small">Año:</label>
          <select
            className="form-select form-select-sm dashboard-currency-select"
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0 earnings-table">
            <thead>
              <tr>
                <th className="px-4 py-3">Mes</th>
                <th className="px-4 py-3">Ingresos</th>
                <th className="px-4 py-3">Gastos</th>
                <th className="px-4 py-3">Ganancia</th>
                <th className="px-4 py-3">Socio 1 (50%)</th>
                <th className="px-4 py-3">Socio 2 (50%)</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    Cargando...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted">
                    No hay registros para {selectedYear}
                  </td>
                </tr>
              ) : (
                rows.map(row => {
                  const hasData = parseFloat(row.ingresos || 0) > 0 || parseFloat(row.gastos || 0) > 0;
                  return (
                    <tr key={row.month} className={!hasData ? 'earnings-empty-row' : ''}>
                      <td className="px-4 py-2 fw-semibold">{row.month_name}</td>
                      <td className="px-4 py-2 text-success">
                        {hasData ? <AmountDisplay amount={row.ingresos} rates={rates} /> : '—'}
                      </td>
                      <td className="px-4 py-2 text-danger">
                        {hasData ? <AmountDisplay amount={row.gastos} rates={rates} /> : '—'}
                      </td>
                      <td className="px-4 py-2 fw-semibold">
                        {hasData ? <AmountDisplay amount={row.ganancia} rates={rates} /> : '—'}
                      </td>
                      <td className="px-4 py-2">
                        {hasData ? <AmountDisplay amount={row.socio_1} rates={rates} /> : '—'}
                      </td>
                      <td className="px-4 py-2">
                        {hasData ? <AmountDisplay amount={row.socio_2} rates={rates} /> : '—'}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`badge ${row.cerrado ? 'bg-success' : 'bg-secondary'}`}>
                          {row.cerrado ? 'Cerrado' : 'Abierto'}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => openModal(row)}
                          title="Editar notas y estado"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {!loading && rows.length > 0 && (
              <tfoot className="earnings-tfoot">
                <tr>
                  <td className="px-4 py-2 fw-bold">Totales {selectedYear}</td>
                  <td className="px-4 py-2 fw-bold text-success"><AmountDisplay amount={totals.ingresos} rates={rates} /></td>
                  <td className="px-4 py-2 fw-bold text-danger"><AmountDisplay amount={totals.gastos} rates={rates} /></td>
                  <td className="px-4 py-2 fw-bold"><AmountDisplay amount={totals.ganancia} rates={rates} /></td>
                  <td className="px-4 py-2 fw-bold"><AmountDisplay amount={totals.socio_1} rates={rates} /></td>
                  <td className="px-4 py-2 fw-bold"><AmountDisplay amount={totals.socio_2} rates={rates} /></td>
                  <td className="px-4 py-2"></td>
                  <td className="px-4 py-2"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {modal.show && (
        <>
          <div className="modal-backdrop-earnings" onClick={closeModal}></div>
          <div className="earnings-modal">
            <div className="card border-0 shadow-lg earnings-modal-card">
              <div className="card-header dashboard-card-header d-flex justify-content-between align-items-center">
                <span>
                  <i className="bi bi-pencil me-2"></i>
                  Editar mes: <strong>{rows.find(r => r.month === modal.month)?.month_name}</strong>
                </span>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label htmlFor="earningsNotas" className="form-label">Notas</label>
                  <textarea
                    id="earningsNotas"
                    className="form-control"
                    rows={4}
                    value={modal.notas}
                    onChange={e => setModal(prev => ({ ...prev, notas: e.target.value }))}
                    placeholder="Observaciones del mes..."
                  />
                </div>
                <div className="form-check mb-4">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="earningsCerrado"
                    checked={modal.cerrado}
                    onChange={e => setModal(prev => ({ ...prev, cerrado: e.target.checked }))}
                  />
                  <label className="form-check-label" htmlFor="earningsCerrado">
                    Marcar como cerrado
                  </label>
                </div>
                <div className="d-flex gap-2 justify-content-end">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Earnings;
