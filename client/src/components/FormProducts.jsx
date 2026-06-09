const FormProducts = ({ formData, setFormData, editingProduct, onSubmit, onClose }) => {
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-white rounded shadow p-4 mb-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h5>
        <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
      </div>
      <form onSubmit={onSubmit} className="row g-3">
        <div className="col-md-6">
          <label htmlFor="name" className="form-label">Nombre *</label>
          <input
            type="text"
            className="form-control"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="price" className="form-label">Precio *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="form-control"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-12">
          <label htmlFor="description" className="form-label">Descripción</label>
          <textarea
            className="form-control"
            id="description"
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="stock" className="form-label">Stock</label>
          <input
            type="number"
            min="0"
            className="form-control"
            id="stock"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
          />
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
