import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const debounceRef = useRef(null);

  const loadLogs = (q, table, action, p) => {
    setLoading(true);
    setError('');
    const params = { page: p, limit: 15 };
    if (q) params.q = q;
    if (table) params.table = table;
    if (action) params.action = action;

    axios.get('http://localhost:3000/audit', { params })
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
    loadLogs(search, filterTable, filterAction, page);
  }, [page]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      loadLogs(search, filterTable, filterAction, 1);
    }, 350);
  }, [search]);

  useEffect(() => {
    setPage(1);
    loadLogs(search, filterTable, filterAction, 1);
  }, [filterTable, filterAction]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Registro de Auditoría</h5>
        <span className="text-muted small">
          {pagination.total} registros
        </span>
      </div>

      <div className="bg-white rounded shadow p-3 mb-3">
        <div className="row g-2">
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
