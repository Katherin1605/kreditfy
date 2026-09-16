import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import FormProducts from '../components/FormProducts';
import ImportModal from '../components/ImportModal';
import TableSkeleton from '../components/TableSkeleton';
import AmountDisplay from '../components/AmountDisplay';
import { useExchangeRates } from '../context/ExchangeRatesContext';
import useConfirm from '../hooks/useConfirm';

const PRODUCT_FIELDS = [
  { key: 'name',        label: 'Nombre',           required: true,  aliases: ['nombre', 'producto', 'articulo', 'artículo', 'item'] },
  { key: 'sku',         label: 'SKU',              required: false, aliases: ['codigo', 'código', 'code', 'ref', 'referencia', 'sku'] },
  { key: 'price',       label: 'Precio de venta',  required: true,  aliases: ['precio de venta', 'precio venta', 'pvp', 'sale price', 'precio final'] },
  { key: 'cost_price',  label: 'Precio de compra', required: false, aliases: ['precio de compra', 'precio compra', 'costo', 'cost', 'cost price'] },
  { key: 'description', label: 'Descripción',      required: false, aliases: ['desc', 'detalle', 'descripcion', 'descripción'] },
  { key: 'stock',       label: 'Stock',             required: false, aliases: ['cantidad', 'existencia', 'inventario', 'qty'] },
];

const cleanNumber = (v) => {
  const s = String(v ?? '').trim().replace(/[^0-9.,-]/g, '');
  if (!s) return NaN;
  if (s.includes('.') && s.includes(',')) return parseFloat(s.replace(/,/g, ''));
  if (s.includes(',') && !s.includes('.')) return parseFloat(s.replace(',', '.'));
  return parseFloat(s);
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '', cost_price: '', description: '', stock: '', sku: '' });
  const [formErrors, setFormErrors] = useState({});
  const [exporting, setExporting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [stockModal, setStockModal] = useState(null);
  const [stockForm, setStockForm] = useState({ quantity: '', cost: '', exchange_rate: '', date: '' });
  const [savingStock, setSavingStock] = useState(false);
  const { confirmModal, ask } = useConfirm();
  const { rates } = useExchangeRates();

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = () => {
    axios.get('/products')
      .then(res => setProducts(res.data))
      .catch(err => toast.error(err.response?.data?.error || 'Error al cargar productos'))
      .finally(() => setLoading(false));
  };

  const handleNew = () => {
    setFormData({ name: '', price: '', cost_price: '', description: '', stock: '', sku: '' });
    setEditingProduct(null);
    setFormErrors({});
    setShowForm(true);
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      price: product.price?.toString() || '',
      cost_price: product.cost_price?.toString() || '',
      description: product.description || '',
      stock: product.stock !== undefined ? product.stock.toString() : '',
      sku: product.sku || '',
    });
    setEditingProduct(product);
    setFormErrors({});
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const ok = await ask('¿Eliminar este producto?');
    if (!ok) return;
    axios.delete(`/products/${id}`)
      .then(() => { toast.success('Producto eliminado'); loadProducts(); })
      .catch(err => toast.error(err.response?.data?.error || 'Error al eliminar'));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!formData.name.trim()) errs.name = 'El nombre es obligatorio';
    const priceRaw = parseFloat(formData.price.toString().replace(/,/g, ''));
    if (!formData.price || isNaN(priceRaw)) errs.price = 'El precio de venta es obligatorio';
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormErrors({});
    const costRaw = parseFloat(formData.cost_price.toString().replace(/,/g, ''));
    const cleanData = {
      ...formData,
      price: priceRaw,
      cost_price: isNaN(costRaw) ? null : costRaw,
      sku: formData.sku.trim() || null,
    };
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
        if (msg.toLowerCase().includes('nombre') || msg.toLowerCase().includes('exist')) {
          setFormErrors({ name: 'Ya existe un producto con ese nombre' });
        } else { toast.error(msg); }
      });
  };

  const resetForm = () => {
    setFormData({ name: '', price: '', cost_price: '', description: '', stock: '', sku: '' });
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
      const headers = ['Nombre', 'Descripción', 'Precio venta', 'Precio compra', 'Stock'];
      const rows = data.map(p => [p.name, p.description ?? '', p.price, p.cost_price ?? '', p.stock]);
      const csv  = [headers, ...rows].map(r => r.map(escape).join(';')).join('\r\n');
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `productos_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click(); URL.revokeObjectURL(url);
      toast.success(`${data.length} productos exportados`);
    } catch { toast.error('Error al exportar'); }
    finally { setExporting(false); }
  };

  const handleImport = async (rows) => {
    const valid = rows.filter(r => r.name?.trim() && !isNaN(cleanNumber(r.price)));
    if (!valid.length) {
      toast.error(`No se encontraron filas válidas. Verifica que la columna de precio tenga valores numéricos y que el mapeo sea correcto.`);
      return;
    }
    const cleaned = valid.map(r => ({
      name:        r.name.trim(),
      description: r.description?.trim() || '',
      price:       cleanNumber(r.price),
      cost_price:  !isNaN(cleanNumber(r.cost_price)) ? cleanNumber(r.cost_price) : null,
      stock:       parseInt(r.stock) || 0,
    }));
    setImporting(true);
    try {
      const res = await axios.post('/products/import', { products: cleaned });
      const { inserted, updated } = res.data;
      const parts = [];
      if (inserted) parts.push(`${inserted} nuevos`);
      if (updated)  parts.push(`${updated} actualizados`);
      toast.success(`Importación completada: ${parts.join(' · ')}`);
      setShowImportModal(false);
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al importar');
    } finally {
      setImporting(false);
    }
  };

  const openStockModal = (product) => {
    setStockModal(product);
    setStockForm({
      quantity: '',
      cost: product.cost_price ? product.cost_price.toString() : '',
      exchange_rate: rates.USD ? String(rates.USD) : '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const handleRegisterStock = async () => {
    if (!stockForm.quantity || parseInt(stockForm.quantity) < 1) {
      return toast.error('Ingresa una cantidad válida');
    }
    setSavingStock(true);
    try {
      await axios.post('/shopping', {
        product_id: stockModal.id,
        quantity: parseInt(stockForm.quantity),
        cost: parseFloat(stockForm.cost.toString().replace(/,/g, '')) || 0,
        exchange_rate: parseFloat(stockForm.exchange_rate) || null,
        date: stockForm.date,
      });
      toast.success(`Stock registrado: +${stockForm.quantity} unidades de ${stockModal.name}`);
      setStockModal(null);
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al registrar stock');
    } finally {
      setSavingStock(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {confirmModal}

      <ImportModal
        show={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
        fields={PRODUCT_FIELDS}
        title="Importar Productos"
        importing={importing}
      />

      {/* Modal registrar stock */}
      {stockModal && (
        <div className="modal show d-block modal-overlay">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-box-arrow-in-down me-2"></i>
                  Registrar entrada de stock
                </h5>
                <button className="btn-close" onClick={() => setStockModal(null)} disabled={savingStock} />
              </div>
              <div className="modal-body">
                <p className="text-muted small mb-3">
                  Producto: <strong>{stockModal.name}</strong> — Stock actual: <strong>{stockModal.stock}</strong>
                </p>
                <div className="row g-3">
                  <div className="col-6">
                    <label className="form-label">Fecha *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={stockForm.date}
                      onChange={e => setStockForm({ ...stockForm, date: e.target.value })}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Cantidad *</label>
                    <input
                      type="number"
                      min="1"
                      className="form-control"
                      value={stockForm.quantity}
                      onChange={e => setStockForm({ ...stockForm, quantity: e.target.value })}
                      placeholder="Unidades que ingresan"
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Costo unit. (USD)</label>
                    <div className="input-group">
                      <span className="input-group-text">$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        className="form-control"
                        value={stockForm.cost}
                        onChange={e => setStockForm({ ...stockForm, cost: e.target.value.replace(/[^0-9.]/g, '') })}
                        placeholder={stockModal.cost_price || '0.00'}
                      />
                    </div>
                  </div>
                  <div className="col-6">
                    <label className="form-label">Tasa BCV <small className="text-muted">(Bs./$)</small></label>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="form-control"
                      value={stockForm.exchange_rate}
                      onChange={e => setStockForm({ ...stockForm, exchange_rate: e.target.value.replace(/[^0-9.]/g, '') })}
                      placeholder="Ej: 50.00"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-danger" onClick={() => setStockModal(null)} disabled={savingStock}>Cancelar</button>
                <button className="btn btn-success" onClick={handleRegisterStock} disabled={savingStock}>
                  {savingStock
                    ? <><span className="spinner-border spinner-border-sm me-2" />Guardando...</>
                    : <><i className="bi bi-check-lg me-1" />Registrar entrada</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Productos</h5>
        <div className="d-flex gap-2 align-items-center flex-wrap">
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
              ? <><span className="spinner-border spinner-border-sm me-1" />Exportando...</>
              : <><i className="bi bi-file-earmark-spreadsheet me-1" />Exportar</>
            }
          </button>
          <button
            className="btn btn-outline-primary text-nowrap"
            onClick={() => setShowImportModal(true)}
          >
            <i className="bi bi-file-earmark-arrow-up me-1" />Importar
          </button>
          <button className="btn btn-primary text-nowrap" onClick={handleNew}>
            <i className="bi bi-plus-lg me-1" />Nuevo
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
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">P. Compra</th>
                <th className="px-4 py-3">P. Venta</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton cols={6} />
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-muted">
                    {products.length === 0 ? 'No hay productos registrados' : 'No se encontraron productos'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => (
                  <tr key={p.id}>
                    <td className="px-4 py-2 fw-medium">{p.name}</td>
                    <td className="px-4 py-2">
                      {p.sku
                        ? <span className="badge bg-light text-secondary border">{p.sku}</span>
                        : <span className="text-muted">—</span>
                      }
                    </td>
                    <td className="px-4 py-2">
                      {p.cost_price != null
                        ? <AmountDisplay amount={p.cost_price} rates={rates} />
                        : <span className="text-muted">—</span>
                      }
                    </td>
                    <td className="px-4 py-2"><AmountDisplay amount={p.price} rates={rates} /></td>
                    <td className="px-4 py-2">
                      <span className={p.stock <= 0 ? 'text-danger fw-bold' : ''}>{p.stock}</span>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        className="btn btn-sm btn-outline-success me-1"
                        onClick={() => openStockModal(p)}
                        title="Registrar entrada de stock"
                      >
                        <i className="bi bi-box-arrow-in-down"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEdit(p)} title="Editar">
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(p.id)} title="Eliminar">
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
    </>
  );
};

export default Products;
