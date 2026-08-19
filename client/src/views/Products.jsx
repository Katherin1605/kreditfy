import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import FormProducts from '../components/FormProducts';
import TableSkeleton from '../components/TableSkeleton';
import AmountDisplay from '../components/AmountDisplay';
import { useExchangeRates } from '../context/ExchangeRatesContext';
import useConfirm from '../hooks/useConfirm';

const splitCSVLine = (line, sep) => {
  const result = [];
  let current = '', inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === sep && !inQuotes) {
      result.push(current); current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
};

const parseProductsCSV = (text) => {
  const clean = text.replace(/^﻿/, '');
  const lines = clean.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return null;
  const sep = lines[0].includes(';') ? ';' : ',';
  const headers = splitCSVLine(lines[0], sep).map(h =>
    h.trim().replace(/^"|"$/g, '').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
  );
  const idx = {
    name:        headers.findIndex(h => h.includes('nombre') || h === 'name'),
    price:       headers.findIndex(h => h.includes('precio') || h === 'price'),
    description: headers.findIndex(h => h.includes('descripcion') || h === 'description'),
    stock:       headers.findIndex(h => h === 'stock'),
  };
  if (idx.name === -1 || idx.price === -1) return null;
  return lines.slice(1)
    .map(line => {
      const cols = splitCSVLine(line, sep).map(c => c.trim().replace(/^"|"$/g, ''));
      return {
        name:        cols[idx.name]        || '',
        price:       cols[idx.price]       || '',
        description: idx.description !== -1 ? (cols[idx.description] || '') : '',
        stock:       idx.stock       !== -1 ? (cols[idx.stock]       || '0') : '0',
      };
    })
    .filter(r => r.name && r.price && !isNaN(parseFloat(r.price)));
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '', description: '', stock: '' });
  const [formErrors, setFormErrors] = useState({});
  const [exporting, setExporting] = useState(false);
  const [importPreview, setImportPreview] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const importRef = useRef(null);
  const { confirmModal, ask } = useConfirm();
  const { rates } = useExchangeRates();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    axios.get('/products')
      .then(res => setProducts(res.data))
      .catch(err => toast.error(err.response?.data?.error || 'Error al cargar productos'))
      .finally(() => setLoading(false));
  };

  const handleNew = () => {
    setFormData({ name: '', price: '', description: '', stock: '' });
    setEditingProduct(null);
    setFormErrors({});
    setShowForm(true);
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      price: product.price.toString(),
      description: product.description || '',
      stock: product.stock !== undefined ? product.stock.toString() : '',
    });
    setEditingProduct(product);
    setFormErrors({});
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const ok = await ask('¿Eliminar este producto?');
    if (!ok) return;
    axios.delete(`/products/${id}`)
      .then(() => {
        toast.success('Producto eliminado');
        loadProducts();
      })
      .catch(err => toast.error(err.response?.data?.error || 'Error al procesar la solicitud'));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!formData.name.trim()) errs.name = 'El nombre es obligatorio';
    const priceRaw = parseFloat(formData.price.toString().replace(/,/g, ''));
    if (!formData.price || isNaN(priceRaw)) errs.price = 'El precio es obligatorio';
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormErrors({});
    const cleanData = { ...formData, price: priceRaw };
    const request = editingProduct
      ? axios.put(`/products/${editingProduct.id}`, cleanData)
      : axios.post('/products', cleanData);
    request
      .then(() => {
        toast.success(editingProduct ? 'Producto actualizado' : 'Producto creado');
        resetForm();
        loadProducts();
      })
      .catch(err => {
        const msg = err.response?.data?.error || 'Error al procesar la solicitud';
        const lower = msg.toLowerCase();
        if (lower.includes('nombre') && lower.includes('exist')) {
          setFormErrors({ name: 'Ya existe un producto con ese nombre' });
        } else if (lower.includes('precio')) {
          setFormErrors({ price: msg });
        } else if (lower.includes('stock')) {
          setFormErrors({ stock: msg });
        } else {
          toast.error(msg);
        }
      });
  };

  const resetForm = () => {
    setFormData({ name: '', price: '', description: '', stock: '' });
    setEditingProduct(null);
    setFormErrors({});
    setShowForm(false);
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const res  = await axios.get('/products');
      const data = res.data;
      const escape = (v) => {
        const s = v === null || v === undefined ? '' : String(v);
        return s.includes(';') || s.includes('"') || s.includes('\n')
          ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const headers = ['Nombre', 'Descripción', 'Precio', 'Stock'];
      const rows = data.map(p => [p.name, p.description ?? '', p.price, p.stock]);
      const csv  = [headers, ...rows].map(r => r.map(escape).join(';')).join('\r\n');
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `productos_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${data.length} productos exportados`);
    } catch {
      toast.error('Error al exportar el CSV');
    } finally {
      setExporting(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseProductsCSV(ev.target.result);
      if (parsed === null) {
        toast.error('El CSV debe tener columnas "Nombre" y "Precio"');
        return;
      }
      if (parsed.length === 0) {
        toast.error('No se encontraron filas válidas en el archivo');
        return;
      }
      setImportPreview(parsed);
      setShowImportModal(true);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleConfirmImport = async () => {
    setImporting(true);
    try {
      const res = await axios.post('/products/import', { products: importPreview });
      toast.success(`${res.data.inserted} productos importados`);
      setShowImportModal(false);
      setImportPreview([]);
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al importar');
    } finally {
      setImporting(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {confirmModal}
      <input ref={importRef} type="file" accept=".csv" className="d-none" onChange={handleFileSelect} />
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Productos</h5>
        <div className="d-flex gap-2 align-items-center">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Buscar por nombre..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            className="btn btn-outline-success text-nowrap"
            onClick={handleExportCSV}
            disabled={exporting || products.length === 0}
            title="Exportar productos a CSV"
          >
            {exporting
              ? <><span className="spinner-border spinner-border-sm me-1" role="status"></span>Exportando...</>
              : <><i className="bi bi-file-earmark-spreadsheet me-1"></i>Exportar</>
            }
          </button>
          <button
            className="btn btn-outline-primary text-nowrap"
            onClick={() => importRef.current.click()}
            title="Importar productos desde CSV"
          >
            <i className="bi bi-file-earmark-arrow-up me-1"></i>Importar
          </button>
          <button className="btn btn-primary text-nowrap" onClick={handleNew}>
            <i className="bi bi-plus-lg me-1"></i> Nuevo Producto
          </button>
        </div>
      </div>

      {showForm && (
        <FormProducts
          formData={formData}
          setFormData={setFormData}
          editingProduct={editingProduct}
          onSubmit={handleSubmit}
          onClose={resetForm}
          errors={formErrors}
        />
      )}

      <div className="bg-white rounded shadow overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="sales-table-head">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton cols={5} />
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-5 text-muted">
                    {products.length === 0 ? 'No hay productos registrados' : 'No se encontraron productos con ese nombre'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => (
                  <tr key={p.id}>
                    <td className="px-4 py-2">{p.name}</td>
                    <td className="px-4 py-2">{p.description || '-'}</td>
                    <td className="px-4 py-2"><AmountDisplay amount={p.price} rates={rates} /></td>
                    <td className="px-4 py-2">{p.stock}</td>
                    <td className="px-4 py-2">
                      <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEdit(p)}>
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(p.id)}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {showImportModal && (
        <>
          <div className="modal-backdrop fade show" onClick={() => !importing && setShowImportModal(false)} />
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-lg modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="bi bi-file-earmark-arrow-up me-2"></i>
                    Importar Productos desde CSV
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowImportModal(false)} disabled={importing} />
                </div>
                <div className="modal-body">
                  <p className="text-muted small mb-3">
                    Se encontraron <strong>{importPreview.length}</strong> productos en el archivo.
                  </p>
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Nombre</th>
                          <th>Descripción</th>
                          <th>Precio</th>
                          <th>Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.slice(0, 10).map((p, i) => (
                          <tr key={i}>
                            <td>{p.name}</td>
                            <td>{p.description || '-'}</td>
                            <td>${parseFloat(p.price).toFixed(2)}</td>
                            <td>{p.stock || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {importPreview.length > 10 && (
                    <p className="text-muted small mt-2 mb-0">... y {importPreview.length - 10} filas más</p>
                  )}
                </div>
                <div className="modal-footer">
                  <button className="btn btn-outline-secondary" onClick={() => setShowImportModal(false)} disabled={importing}>
                    Cancelar
                  </button>
                  <button className="btn btn-success" onClick={handleConfirmImport} disabled={importing}>
                    {importing
                      ? <><span className="spinner-border spinner-border-sm me-1" role="status"></span>Importando...</>
                      : <><i className="bi bi-check-lg me-1"></i>Confirmar importación</>
                    }
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

export default Products;
