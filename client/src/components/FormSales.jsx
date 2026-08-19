import { useState, useEffect, Fragment } from 'react';

const STEPS = ['Cliente', 'Productos', 'Confirmar'];

const FormSales = ({
  customers, products,
  selectedCustomerId, setSelectedCustomerId,
  items, setItems,
  editingSale,
  cuotas, setCuotas,
  saleDate, setSaleDate,
  exchangeRate, setExchangeRate,
  onSubmit, onClose,
}) => {
  const [step, setStep] = useState(1);
  const [clienteSearch, setClienteSearch] = useState('');
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const [productoSearch, setProductoSearch] = useState('');
  const [showProductoDropdown, setShowProductoDropdown] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [stepError, setStepError] = useState('');
  const [localExchangeRate, setLocalExchangeRate] = useState(exchangeRate ?? '');

  useEffect(() => {
    if (selectedCustomerId) {
      const c = customers.find(c => c.id === parseInt(selectedCustomerId));
      if (c) setClienteSearch(c.name);
    }
  }, []);

  const filteredClientes = clienteSearch
    ? customers.filter(c =>
        c.name.toLowerCase().includes(clienteSearch.toLowerCase()) ||
        c.identity_card.includes(clienteSearch)
      )
    : customers;

  const filteredProducts = productoSearch
    ? products.filter(p => p.name.toLowerCase().includes(productoSearch.toLowerCase()))
    : products;

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
        product_id:   product.id,
        product_name: product.name,
        quantity:     cantidadNum,
        price:        parseFloat(product.price),
        subtotal:     cantidadNum * parseFloat(product.price),
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
  const selectedCustomer = customers.find(c => c.id === parseInt(selectedCustomerId));

  const goNext = () => {
    if (step === 1 && !selectedCustomerId) {
      setStepError('Selecciona un cliente para continuar');
      return;
    }
    if (step === 2 && items.length === 0) {
      setStepError('Agrega al menos un producto');
      return;
    }
    setStepError('');
    setStep(s => s + 1);
  };

  const goBack = () => {
    setStepError('');
    setStep(s => s - 1);
  };

  return (
    <div className="card border shadow-sm mb-4">
      <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
        <h5 className="mb-0">{editingSale ? 'Editar Venta' : 'Nueva Venta'}</h5>
        <button type="button" className="btn-close" onClick={onClose} aria-label="Cerrar" />
      </div>

      {/* Stepper */}
      <div className="form-stepper">
        {STEPS.map((label, i) => (
          <Fragment key={i}>
            {i > 0 && (
              <div className={`form-stepper-line${step > i ? ' done' : ''}`} />
            )}
            <div className="form-stepper-item">
              <div className={`form-stepper-circle${step === i + 1 ? ' active' : ''}${step > i + 1 ? ' done' : ''}`}>
                {step > i + 1 ? <i className="bi bi-check-lg" /> : i + 1}
              </div>
              <span className={`form-stepper-label${step === i + 1 ? ' active' : ''}`}>{label}</span>
            </div>
          </Fragment>
        ))}
      </div>

      <div>
        <div className="card-body">

          {/* ── Paso 1: Cliente ── */}
          {step === 1 && (
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">
                  Cliente <span className="text-danger">*</span>
                </label>
                <div className="position-relative">
                  <input
                    type="text"
                    className={`form-control${stepError && !selectedCustomerId ? ' is-invalid' : ''}`}
                    placeholder="Buscar por nombre o cédula..."
                    value={clienteSearch}
                    onChange={e => {
                      setClienteSearch(e.target.value);
                      setSelectedCustomerId('');
                      setStepError('');
                      setShowClienteDropdown(true);
                    }}
                    onFocus={() => setShowClienteDropdown(true)}
                    onBlur={() => setTimeout(() => setShowClienteDropdown(false), 150)}
                  />
                  {showClienteDropdown && filteredClientes.length > 0 && (
                    <ul className="autocomplete-dropdown">
                      {filteredClientes.slice(0, clienteSearch ? 8 : 3).map(c => (
                        <li
                          key={c.id}
                          className="autocomplete-option"
                          onMouseDown={() => {
                            setSelectedCustomerId(String(c.id));
                            setClienteSearch(c.name);
                            setShowClienteDropdown(false);
                            setStepError('');
                          }}
                        >
                          <span>{c.name}</span>
                          <small className="text-muted">{c.identity_card}</small>
                        </li>
                      ))}
                    </ul>
                  )}
                  {stepError && !selectedCustomerId && (
                    <div className="invalid-feedback d-block">{stepError}</div>
                  )}
                </div>
              </div>
              <div className="col-md-4">
                <label className="form-label">
                  Fecha de venta <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={saleDate}
                  onChange={e => setSaleDate(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">
                  Tasa BCV <small className="text-muted">(Bs. por $1)</small>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  className="form-control"
                  value={localExchangeRate}
                  onChange={e => {
                    const v = e.target.value.replace(/[^0-9.]/g, '');
                    setLocalExchangeRate(v);
                    setExchangeRate?.(v);
                  }}
                  placeholder="Ej: 596.78"
                />
              </div>
            </div>
          )}

          {/* ── Paso 2: Productos ── */}
          {step === 2 && (
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Producto</label>
                <div className="position-relative">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar producto..."
                    value={productoSearch}
                    onChange={e => {
                      setProductoSearch(e.target.value);
                      setSelectedProductId('');
                      setShowProductoDropdown(true);
                    }}
                    onFocus={() => setShowProductoDropdown(true)}
                    onBlur={() => setTimeout(() => setShowProductoDropdown(false), 150)}
                  />
                  {showProductoDropdown && filteredProducts.length > 0 && (
                    <ul className="autocomplete-dropdown">
                      {filteredProducts.slice(0, productoSearch ? 8 : 3).map(p => (
                        <li
                          key={p.id}
                          className="autocomplete-option"
                          onMouseDown={() => {
                            setSelectedProductId(String(p.id));
                            setProductoSearch(p.name);
                            setShowProductoDropdown(false);
                          }}
                        >
                          <span>{p.name}</span>
                          <small className="text-muted">${parseFloat(p.price).toFixed(2)} · stock: {p.stock}</small>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div className="col-md-3">
                <label className="form-label">Cantidad</label>
                <input
                  type="number"
                  className="form-control"
                  min={1}
                  value={cantidad}
                  onChange={e => setCantidad(e.target.value)}
                />
              </div>
              <div className="col-md-3 d-flex align-items-end">
                <button type="button" className="btn btn-primary w-100" onClick={handleAddItem}>
                  <i className="bi bi-plus-lg me-1"></i>Agregar
                </button>
              </div>

              {stepError && (
                <div className="col-12">
                  <div className="alert alert-warning py-2 mb-0">
                    <i className="bi bi-exclamation-triangle me-2"></i>{stepError}
                  </div>
                </div>
              )}

              {items.length > 0 && (
                <div className="col-12">
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered mb-1">
                      <thead className="sales-table-head">
                        <tr>
                          <th>Producto</th>
                          <th>Cant.</th>
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
                  <div className="text-end fw-semibold pe-1">
                    Total: ${total.toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Paso 3: Confirmar ── */}
          {step === 3 && (
            <div className="row g-3">
              <div className="col-md-5">
                <div className="form-stepper-summary-box">
                  <p className="form-stepper-summary-label">Cliente</p>
                  <p className="form-stepper-summary-value">{selectedCustomer?.name || '-'}</p>
                  <p className="form-stepper-summary-sub">{selectedCustomer?.identity_card}</p>
                </div>
              </div>
              <div className="col-md-3">
                <div className="form-stepper-summary-box">
                  <p className="form-stepper-summary-label">Fecha</p>
                  <p className="form-stepper-summary-value">
                    {saleDate
                      ? new Date(saleDate + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '-'}
                  </p>
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-stepper-summary-box">
                  <p className="form-stepper-summary-label">Total</p>
                  <p className="form-stepper-summary-value text-success">${total.toFixed(2)}</p>
                </div>
              </div>

              <div className="col-12">
                <div className="table-responsive">
                  <table className="table table-sm table-bordered mb-0">
                    <thead className="sales-table-head">
                      <tr>
                        <th>Producto</th>
                        <th>Cant.</th>
                        <th>Precio Unit.</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(i => (
                        <tr key={i.product_id}>
                          <td>{i.product_name}</td>
                          <td>{i.quantity}</td>
                          <td>${i.price.toFixed(2)}</td>
                          <td>${i.subtotal.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="col-md-4">
                <label className="form-label">
                  Número de cuotas <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  className="form-control"
                  min={1}
                  value={cuotas}
                  onChange={e => setCuotas(e.target.value)}
                />
                {parseInt(cuotas) > 0 && total > 0 && (
                  <small className="text-muted">
                    Valor por cuota: ${(total / parseInt(cuotas)).toFixed(2)}
                  </small>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer de navegación */}
        <div className="card-footer bg-white d-flex justify-content-between align-items-center">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
            Cancelar
          </button>
          <div className="d-flex gap-2">
            {step > 1 && (
              <button type="button" className="btn btn-outline-secondary" onClick={goBack}>
                <i className="bi bi-arrow-left me-1"></i>Anterior
              </button>
            )}
            {step < STEPS.length ? (
              <button type="button" className="btn btn-primary" onClick={goNext}>
                Siguiente<i className="bi bi-arrow-right ms-1"></i>
              </button>
            ) : (
              <button type="button" className="btn btn-success" onClick={onSubmit}>
                <i className="bi bi-check-lg me-1"></i>
                {editingSale ? 'Actualizar Venta' : 'Guardar Venta'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormSales;
