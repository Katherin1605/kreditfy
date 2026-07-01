import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Pagination from '../components/Pagination';

const ACTION_LABELS = { CREATE: 'Crear', UPDATE: 'Editar', DELETE: 'Eliminar' };
const ACTION_BADGES = { CREATE: 'bg-success', UPDATE: 'bg-primary', DELETE: 'bg-danger' };

const TABLE_LABELS = {
  customers: 'Clientes',
  products: 'Productos',
  sales: 'Ventas',
  sale_details: 'Detalles de Venta',
  payments: 'Pagos',
  shopping: 'Compras',
  admins: 'Administradores',
  audit_logs: 'Auditoría',
};

const Audit = () => {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [filterTable, setFilterTable] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const debounceRef = useRef(null);

  const loadLogs = (q, table, action, p, from = '', to = '') => {
    setLoading(true);
    setError('');
    const params = { page: p, limit: 15 };
    if (q) params.q = q;
    if (table) params.table = table;
    if (action) params.action = action;
    if (from) params.date_from = from;
    if (to) params.date_to = to;

    axios.get('/audit', { params })
      .then(res => {
        const data = res.data;
        if (Array.isArray(data)) {
          setLogs(data);
          setPagination({ total: data.length, totalPages: 1 });
        } else {
          setLogs(data.data || []);
          setPagination({ total: data.total || 0, totalPages: data.totalPages || 1 });
        }
      })
      .catch(err => {
        const msg = err.response?.data?.error || err.message || 'Error al cargar los registros';
        setError(`${err.response?.status ? `[${err.response.status}] ` : ''}${msg}`);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLogs(search, filterTable, filterAction, page, dateFrom, dateTo);
  }, [page]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      loadLogs(search, filterTable, filterAction, 1, dateFrom, dateTo);
    }, 350);
  }, [search]);

  useEffect(() => {
    setPage(1);
    loadLogs(search, filterTable, filterAction, 1, dateFrom, dateTo);
  }, [filterTable, filterAction, dateFrom, dateTo]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const params = { page: 1, limit: 99999 };
      if (search)       params.q       = search;
      if (filterTable)  params.table   = filterTable;
      if (filterAction) params.action  = filterAction;
      if (dateFrom)     params.date_from = dateFrom;
      if (dateTo)       params.date_to   = dateTo;

      const res  = await axios.get('/audit', { params });
      const data = Array.isArray(res.data) ? res.data : (res.data.data || []);

      const escape = (v) => {
        const s = v === null || v === undefined ? '' : String(v);
        return s.includes(';') || s.includes('"') || s.includes('\n')
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      };

      const headers = ['Fecha', 'Acción', 'Módulo', 'ID Registro', 'Descripción', 'Administrador'];
      const rows = data.map(log => [
        new Date(log.created_at).toLocaleString('es-ES'),
        ACTION_LABELS[log.action] || log.action,
        TABLE_LABELS[log.table_name] || log.table_name,
        log.record_id ?? '',
        log.description ?? '',
        log.admin_name || 'Sistema',
      ]);

      const csv  = [headers, ...rows].map(r => r.map(escape).join(';')).join('\r\n');
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `auditoria_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${data.length} registros exportados`);
    } catch {
      toast.error('Error al exportar el CSV');
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Registro de Auditoría</h5>
        <div className="d-flex align-items-center gap-3">
          <span className="text-muted small">{pagination.total} registros</span>
          <button
            className="btn btn-sm btn-outline-success"
            onClick={handleExportCSV}
            disabled={exporting || pagination.total === 0}
            title="Exportar registros filtrados a CSV"
          >
            {exporting
              ? <><span className="spinner-border spinner-border-sm me-1" role="status"></span>Exportando...</>
              : <><i className="bi bi-file-earmark-spreadsheet me-1"></i>Exportar CSV</>
            }
          </button>
        </div>
      </div>

      <div className="bg-white rounded shadow p-3 mb-3">
        <div className="row g-2 mb-2">
          <div className="col-md-5">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Buscar por administrador o descripción..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-4">
            <select
              className="form-select"
              value={filterTable}
              onChange={e => setFilterTable(e.target.value)}
            >
              <option value="">Todos los módulos</option>
              {Object.entries(TABLE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
            >
              <option value="">Todas las acciones</option>
              <option value="CREATE">Crear</option>
              <option value="UPDATE">Editar</option>
              <option value="DELETE">Eliminar</option>
            </select>
          </div>
        </div>
        <div className="row g-2 align-items-end">
          <div className="col-auto">
            <label className="form-label small text-muted mb-1">Desde</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={e => setDateFrom(e.target.value)}
            />
          </div>
          <div className="col-auto">
            <label className="form-label small text-muted mb-1">Hasta</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={e => setDateTo(e.target.value)}
            />
          </div>
          {(dateFrom || dateTo) && (
            <div className="col-auto">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => { setDateFrom(''); setDateTo(''); }}
              >
                <i className="bi bi-x-lg me-1"></i>Limpiar fechas
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="d-flex flex-column gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-card skeleton-card-log"></div>
          ))}
        </div>
      ) : error ? (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center text-muted py-5">
          <i className="bi bi-file-earmark-text fs-1 d-block mb-3"></i>
          <p>{pagination.total === 0 ? 'No hay registros de auditoría todavía' : 'No se encontraron registros con ese filtro'}</p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {logs.map(log => (
            <div key={log.id} className="bg-white rounded shadow-sm p-3">
              <div className="d-flex justify-content-between align-items-start">
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span className={`badge ${ACTION_BADGES[log.action] || 'bg-secondary'}`}>
                      {ACTION_LABELS[log.action] || log.action}
                    </span>
                    <span className="badge bg-light text-dark border">
                      {TABLE_LABELS[log.table_name] || log.table_name}
                    </span>
                    {log.record_id && (
                      <span className="text-muted small">#{log.record_id}</span>
                    )}
                  </div>
                  <p className="mb-1 small">{log.description || '—'}</p>
                  <div className="d-flex gap-3 text-muted audit-log-meta">
                    <span>
                      <i className="bi bi-person me-1"></i>
                      {log.admin_name || 'Sistema'}
                    </span>
                    <span>
                      <i className="bi bi-clock me-1"></i>
                      {new Date(log.created_at).toLocaleString('es-ES', {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        onPageChange={handlePageChange}
      />
    </>
  );
};

export default Audit;
