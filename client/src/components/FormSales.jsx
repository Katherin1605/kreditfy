import { useState } from 'react';

const FormSales = ({ customers, products, selectedCustomerId, setSelectedCustomerId, items, setItems, editingSale, cuotas, setCuotas, saleDate, setSaleDate, onSubmit, onClose }) => {
  const [clienteSearch, setClienteSearch] = useState('');
  const [productoSearch, setProductoSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [cantidad, setCantidad] = useState(1);

  const filteredClientes = customers.filter(c =>
    c.name.toLowerCase().includes(clienteSearch.toLowerCase()) ||
    c.identity_card.includes(clienteSearch)
  );

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productoSearch.toLowerCase())
  );

  const handleAddItem = () => {
    if (!selectedProductId) return;
    const product = products.find(p => p.id === parseInt(selectedProductId));
    if (!product) return;
    const cantidadNum = parseInt(cantidad);
    if (cantidadNum < 1) return;
    const existingIndex = items.findIndex(i => i.product_id === product.id);
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantity += cantidadNum;
      updated[existingIndex].subtotal = updated[existingIndex].quantity * updated[existingIndex].price;
      setItems(updated);
    } else {
      setItems([...items, {
        product_id: product.id,
        product_name: product.name,
        quantity: cantidadNum,
        price: parseFloat(product.price),
        subtotal: cantidadNum * parseFloat(product.price),
      }]);
    }
    setSelectedProductId('');
    setCantidad(1);
    setProductoSearch('');
  };

  const handleRemoveItem = (productId) => {
    setItems(items.filter(i => i.product_id !== productId));
  };

  const total = items.reduce((sum, i) => sum + i.subtotal, 0);

  return (
    <div className="border border-secondary-subtle rounded p-4 mb-4 bg-white">
      <div className="d-flex justify-content-between mb-3">
        <h5 className="mb-0">{editingSale ? 'Editar Venta' : 'Nueva Venta'}</h5>
        <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
      </div>

      <form className="row g-3" onSubmit={onSubmit} noValidate>
        <div className="col-12">
          <h6 className="text-muted mb-2">Cliente</h6>
        </div>

        <div className="col-md-6 text-start">
          <label htmlFor="clienteSearch" className="form-label">Buscar cliente</label>
          <input
            type="text"
            className="form-control"
            id="clienteSearch"
            placeholder="Nombre o cédula..."
            value={clienteSearch}
            onChange={e => setClienteSearch(e.target.value)}
          />
        </div>

        <div className="col-md-6 text-start">
          <label htmlFor="selectCliente" className="form-label">Cliente</label>
          <select
            className="form-select"
            id="selectCliente"
            value={selectedCustomerId}
            onChange={e => setSelectedCustomerId(e.target.value)}
          >
            <option value="">Seleccione un cliente</option>
            {filteredClientes.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.identity_card}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-3 text-start">
          <label htmlFor="saleDate" className="form-label">Fecha de venta *</label>
          <input
            type="date"
            className="form-control"
            id="saleDate"
            value={saleDate}
            onChange={e => setSaleDate(e.target.value)}
          />
        </div>

        <div className="col-md-3 text-start">
          <label htmlFor="cuotas" className="form-label">Número de Cuotas *</label>
          <input
            type="number"
            className="form-control"
            id="cuotas"
            min={1}
            value={cuotas}
            onChange={e => setCuotas(e.target.value)}
          />
          {items.length > 0 && parseInt(cuotas) > 0 && (
            <small className="text-muted">
              Valor por cuota: ${(items.reduce((s, i) => s + i.subtotal, 0) / parseInt(cuotas)).toFixed(2)}
            </small>
          )}
        </div>

        <div className="col-12 mt-3">
          <h6 className="text-muted mb-2">Agregar productos</h6>
        </div>

        <div className="col-md-4 text-start">
          <label htmlFor="productoSearch" className="form-label">Buscar producto</label>
          <input
            type="text"
            className="form-control"
            id="productoSearch"
            placeholder="Nombre del producto..."
            value={productoSearch}
            onChange={e => setProductoSearch(e.target.value)}
          />
        </div>

        <div className="col-md-4 text-start">
          <label htmlFor="selectProducto" className="form-label">Producto</label>
          <select
            className="form-select"
            id="selectProducto"
            value={selectedProductId}
            onChange={e => setSelectedProductId(e.target.value)}
          >
            <option value="">Seleccione un producto</option>
            {filteredProducts.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} — ${parseFloat(p.price).toFixed(2)} (stock: {p.stock})
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-2 text-start">
          <label htmlFor="cantidad" className="form-label">Cantidad</label>
          <input
            type="number"
            className="form-control"
            id="cantidad"
            min={1}
            value={cantidad}
            onChange={e => setCantidad(e.target.value)}
          />
        </div>

        <div className="col-md-2 text-start d-flex align-items-end">
          <button
            type="button"
            className="btn btn-primary w-100"
            onClick={handleAddItem}
          >
            <i className="bi bi-plus-lg me-1"></i>
            Agregar
          </button>
        </div>

        {items.length > 0 && (
          <div className="col-12 mt-2">
            <div className="table-responsive">
              <table className="table table-sm table-bordered mb-1">
                <thead className="sales-table-head">
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio Unit.</th>
                    <th>Subtotal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(i => (
                    <tr key={i.product_id}>
                      <td>{i.product_name}</td>
                      <td>{i.quantity}</td>
                      <td>${i.price.toFixed(2)}</td>
                      <td>${i.subtotal.toFixed(2)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleRemoveItem(i.product_id)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-end fw-bold pe-1">
              Total: ${total.toFixed(2)}
            </div>
          </div>
        )}

        <div className="col-12 text-start mt-3">
          <button type="submit" className="btn btn-success">
            {editingSale ? 'Actualizar Venta' : 'Guardar Venta'}
          </button>
          <button type="button" className="btn btn-danger ms-3" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormSales;
