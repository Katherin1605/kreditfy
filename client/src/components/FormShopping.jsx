const FormShopping = ({ formData, setFormData, products, onSubmit, onClose }) => {
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-white rounded shadow p-4 mb-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Nueva Compra</h5>
        <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
      </div>
      <form onSubmit={onSubmit} className="row g-3" noValidate>
        <div className="col-md-12">
          <label className="form-label">Producto *</label>
          <select
            className="form-select"
            name="product_id"
            value={formData.product_id}
            onChange={handleChange}
          >
            <option value="">Seleccione un producto</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
            ))}
          </select>
        </div>

        <div className="col-md-4">
          <label className="form-label">Fecha *</label>
          <input
            type="date"
            className="form-control"
            name="date"
            value={formData.date}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">Cantidad *</label>
          <input
            type="number"
            min="1"
            className="form-control"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">Costo (USD) *</label>
          <input
            type="text"
            inputMode="decimal"
            className="form-control"
            name="cost"
            value={formData.cost}
            onChange={e => {
              const raw = e.target.value.replace(/,/g, '').replace(/[^0-9.]/g, '');
              setFormData({ ...formData, cost: raw });
            }}
            onBlur={() => {
              const num = parseFloat(formData.cost);
              if (!isNaN(num) && num >= 0) {
                const [int, dec = '00'] = num.toFixed(2).split('.');
                const formatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + dec;
                setFormData({ ...formData, cost: formatted });
              }
            }}
            onFocus={e => {
              const raw = formData.cost.toString().replace(/,/g, '');
              setFormData({ ...formData, cost: raw });
              e.target.select();
            }}
          />
        </div>

        <div className="col-12">
          <button type="submit" className="btn btn-success me-2">Guardar</button>
          <button type="button" className="btn btn-danger" onClick={onClose}>Cancelar</button>
        </div>
      </form>
    </div>
  );
};

export default FormShopping;
