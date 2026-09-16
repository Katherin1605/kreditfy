const numericInput = (value, onChange, onBlur, onFocus) => ({
  type: 'text',
  inputMode: 'decimal',
  value,
  onChange: e => {
    const raw = e.target.value.replace(/,/g, '').replace(/[^0-9.]/g, '');
    onChange(raw);
  },
  onBlur: () => {
    const num = parseFloat(value.toString().replace(/,/g, ''));
    if (!isNaN(num) && num >= 0) {
      const [int, dec = '00'] = num.toFixed(2).split('.');
      onBlur(int.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + dec);
    }
  },
  onFocus: e => { onFocus(value.toString().replace(/,/g, '')); e.target.select(); },
});

const FormProducts = ({ formData, setFormData, editingProduct, onSubmit, onClose, errors }) => {
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const setPriceField = (field) => (raw) => setFormData({ ...formData, [field]: raw });

  return (
    <div className="bg-white rounded shadow p-4 mb-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h5>
        <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
      </div>
      <form onSubmit={onSubmit} className="row g-3" noValidate>
        <div className="col-md-5">
          <label htmlFor="name" className="form-label">Nombre *</label>
          <input
            type="text"
            className={`form-control ${errors?.name ? 'is-invalid' : ''}`}
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
          />
          {errors?.name && <div className="invalid-feedback">{errors.name}</div>}
        </div>

        <div className="col-md-3">
          <label htmlFor="sku" className="form-label">SKU</label>
          <input
            type="text"
            className="form-control"
            id="sku"
            name="sku"
            value={formData.sku}
            onChange={handleChange}
            placeholder="Ej: PROD-001"
          />
          <div className="form-text">Código único para identificar el producto</div>
        </div>

        <div className="col-md-4">
          <label htmlFor="description" className="form-label">Descripción</label>
          <input
            type="text"
            className="form-control"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-4">
          <label htmlFor="cost_price" className="form-label">Precio de compra (USD)</label>
          <div className="input-group">
            <span className="input-group-text">$</span>
            <input
              id="cost_price"
              className="form-control"
              placeholder="0.00"
              {...numericInput(
                formData.cost_price,
                setPriceField('cost_price'),
                (v) => setFormData(prev => ({ ...prev, cost_price: v })),
                (v) => setFormData(prev => ({ ...prev, cost_price: v })),
              )}
            />
          </div>
          <div className="form-text">Costo al que adquieres el producto</div>
        </div>

        <div className="col-md-4">
          <label htmlFor="price" className="form-label">Precio de venta (USD) *</label>
          <div className="input-group">
            <span className="input-group-text">$</span>
            <input
              id="price"
              className={`form-control ${errors?.price ? 'is-invalid' : ''}`}
              placeholder="0.00"
              {...numericInput(
                formData.price,
                setPriceField('price'),
                (v) => setFormData(prev => ({ ...prev, price: v })),
                (v) => setFormData(prev => ({ ...prev, price: v })),
              )}
            />
          </div>
          {errors?.price && <div className="invalid-feedback">{errors.price}</div>}
        </div>

        <div className="col-md-4">
          <label htmlFor="stock" className="form-label">Stock</label>
          <input
            type="number"
            min="0"
            className={`form-control ${errors?.stock ? 'is-invalid' : ''}`}
            id="stock"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
          />
          {errors?.stock && <div className="invalid-feedback">{errors.stock}</div>}
        </div>

        <div className="col-12">
          <button type="submit" className="btn btn-success me-2">
            {editingProduct ? 'Actualizar' : 'Guardar'}
          </button>
          <button type="button" className="btn btn-danger" onClick={onClose}>Cancelar</button>
        </div>
      </form>
    </div>
  );
};

export default FormProducts;
