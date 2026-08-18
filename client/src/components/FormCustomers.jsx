const VALID_PREFIXES = ['0412', '0414', '0416', '0424', '0426'];

const formatCedula = (raw) => {
  const digits = raw.replace(/\D/g, '');
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const FormCustomers = ({ formData, setFormData, editingCustomer, onSubmit, onClose, errors }) => {
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCedulaChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '');
    setFormData({ ...formData, identity_card: digits });
  };

  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
    setFormData({ ...formData, phone: digits });
  };

  return (
    <div className="bg-white rounded shadow p-4 mb-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>{editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}</h5>
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
          <label htmlFor="identity_card" className="form-label">Cédula *</label>
          <input
            type="text"
            inputMode="numeric"
            className={`form-control ${errors?.identity_card ? 'is-invalid' : ''}`}
            id="identity_card"
            name="identity_card"
            value={formatCedula(formData.identity_card)}
            onChange={handleCedulaChange}
            placeholder="12.345.678"
          />
          {errors?.identity_card && <div className="invalid-feedback">{errors.identity_card}</div>}
        </div>
        <div className="col-md-6">
          <label htmlFor="phone" className="form-label">Teléfono</label>
          <input
            type="tel"
            inputMode="numeric"
            className={`form-control ${errors?.phone ? 'is-invalid' : ''}`}
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handlePhoneChange}
            placeholder="04126756788"
          />
          {errors?.phone
            ? <div className="invalid-feedback">{errors.phone}</div>
            : <div className="form-text">Prefijos válidos: 0412, 0414, 0416, 0424, 0426</div>
          }
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
