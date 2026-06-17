const FormProducts = ({ formData, setFormData, editingProduct, onSubmit, onClose, errors }) => {
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-white rounded shadow p-4 mb-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h5>
        <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
      </div>
      <form onSubmit={onSubmit} className="row g-3" noValidate>
        <div className="col-md-6">
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
        <div className="col-md-6">
          <label htmlFor="price" className="form-label">Precio (Bs.) *</label>
          <input
            type="text"
            inputMode="decimal"
            className={`form-control ${errors?.price ? 'is-invalid' : ''}`}
            id="price"
            name="price"
            value={formData.price}
            onChange={e => {
              const raw = e.target.value.replace(/,/g, '').replace(/[^0-9.]/g, '');
              setFormData({ ...formData, price: raw });
            }}
            onBlur={() => {
              const num = parseFloat(formData.price);
              if (!isNaN(num) && num >= 0) {
                const [int, dec = '00'] = num.toFixed(2).split('.');
                const formatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + dec;
                setFormData({ ...formData, price: formatted });
              }
            }}
            onFocus={e => {
              const raw = formData.price.toString().replace(/,/g, '');
              setFormData({ ...formData, price: raw });
              e.target.select();
            }}
          />
          {errors?.price && <div className="invalid-feedback">{errors.price}</div>}
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
