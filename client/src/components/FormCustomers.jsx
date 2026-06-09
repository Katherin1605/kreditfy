const FormCustomers = ({ formData, setFormData, editingCustomer, onSubmit, onClose }) => {
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-white rounded shadow p-4 mb-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>{editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}</h5>
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
          <label htmlFor="identity_card" className="form-label">Cédula *</label>
          <input
            type="text"
            className="form-control"
            id="identity_card"
            name="identity_card"
            value={formData.identity_card}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="phone" className="form-label">Teléfono</label>
          <input
            type="tel"
            className="form-control"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="04126756788"
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="address" className="form-label">Dirección</label>
          <input
            type="text"
            className="form-control"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
          />
        </div>
        <div className="col-12">
          <button type="submit" className="btn btn-success me-2">
            {editingCustomer ? 'Actualizar' : 'Guardar'}
          </button>
          <button type="button" className="btn btn-danger" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormCustomers;
