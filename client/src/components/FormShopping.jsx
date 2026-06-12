import { useState } from 'react';

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
        <div className="col-md-6">
          <label className="form-label">Cantidad *</label>
          <input
            type="number"
            min="1"
            className="form-control"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Costo *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="form-control"
            name="cost"
            value={formData.cost}
            onChange={handleChange}
            required
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
