import { useState, useEffect } from 'react';
import axios from 'axios';

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

  useEffect(() => {
    axios.get('http://localhost:3000/audit')
      .then(res => setLogs(res.data))
      .catch(err => {
        const msg = err.response?.data?.error || err.message || 'Error al cargar los registros';
        setError(`${err.response?.status ? `[${err.response.status}] ` : ''}${msg}`);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(log => {
    const matchSearch = !search ||
      (log.admin_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.description || '').toLowerCase().includes(search.toLowerCase());
    const matchTable = !filterTable || log.table_name === filterTable;
    const matchAction = !filterAction || log.action === filterAction;
    return matchSearch && matchTable && matchAction;
  });

  const uniqueTables = [...new Set(logs.map(l => l.table_name).filter(Boolean))];

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Registro de Auditoría</h5>
        <span className="text-muted small">
          {filtered.length} de {logs.length} registros
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
              {uniqueTables.map(t => (
                <option key={t} value={t}>{TABLE_LABELS[t] || t}</option>
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
            <div key={i} className="skeleton-card" style={{ height: '80px' }}></div>
          ))}
        </div>
      ) : error ? (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-muted py-5">
          <i className="bi bi-file-earmark-text fs-1 d-block mb-3"></i>
          <p>{logs.length === 0 ? 'No hay registros de auditoría todavía' : 'No se encontraron registros con ese filtro'}</p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {filtered.map(log => (
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
                  <div className="d-flex gap-3 text-muted" style={{ fontSize: '0.78rem' }}>
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
    </>
  );
};

export default Audit;
