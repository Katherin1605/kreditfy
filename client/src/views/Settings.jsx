import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { currentAdmin, updateCurrentAdmin } = useAuth();
  const [threshold, setThreshold] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState('');
  const logoRef = useRef(null);

  useEffect(() => {
    axios.get('/settings')
      .then(res => {
        setThreshold(String(res.data.low_stock_threshold ?? 5));
        setLogoPreview(res.data.logo_url || '');
      })
      .catch(() => toast.error('Error al cargar configuración'));
  }, []);

  const handleSaveThreshold = async (e) => {
    e.preventDefault();
    const val = parseInt(threshold);
    if (isNaN(val) || val < 1) return toast.error('Ingresa un número válido mayor a 0');
    setSaving(true);
    try {
      await axios.put('/settings/low-stock', { low_stock_threshold: val });
      toast.success('Umbral de stock bajo actualizado');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append('logo', file);
    try {
      const res = await axios.post('/settings/logo', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newUrl = res.data.logo_url;
      setLogoPreview(newUrl);
      updateCurrentAdmin({ tenant_logo: newUrl });
      toast.success('Logo actualizado');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al subir el logo');
    } finally {
      setUploading(false);
      if (logoRef.current) logoRef.current.value = '';
    }
  };

  return (
    <>
      <h5 className="mb-4">Configuración</h5>

      <div className="row g-4">
        {/* Logo */}
        <div className="col-md-5">
          <div className="bg-white rounded shadow p-4 h-100">
            <h6 className="fw-semibold mb-1">Logo del negocio</h6>
            <p className="text-muted small mb-3">
              Aparece en el sidebar. Recomendado: imagen cuadrada, mínimo 100×100 px.
            </p>
            <div className="settings-logo-preview mb-3">
              {logoPreview
                ? <img src={logoPreview} alt="Logo actual" className="settings-logo-img" />
                : <div className="settings-logo-placeholder">
                    <i className="bi bi-image text-muted fs-2"></i>
                  </div>
              }
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => logoRef.current?.click()}
              disabled={uploading}
            >
              {uploading
                ? <><span className="spinner-border spinner-border-sm me-2" />Subiendo...</>
                : <><i className="bi bi-upload me-2" />{logoPreview ? 'Cambiar logo' : 'Subir logo'}</>
              }
            </button>
            <input
              ref={logoRef}
              type="file"
              accept="image/*"
              className="d-none"
              onChange={handleLogoChange}
            />
          </div>
        </div>

        {/* Stock bajo */}
        <div className="col-md-7">
          <div className="bg-white rounded shadow p-4">
            <h6 className="fw-semibold mb-1">Umbral de stock bajo</h6>
            <p className="text-muted small mb-3">
              Los productos con stock igual o menor a este valor aparecen como "stock bajo" en el Dashboard y en Productos.
            </p>
            <form onSubmit={handleSaveThreshold} className="d-flex align-items-end gap-3">
              <div>
                <label className="form-label small">Límite de stock bajo</label>
                <input
                  type="number"
                  min="1"
                  max="9999"
                  className="form-control settings-threshold-input"
                  value={threshold}
                  onChange={e => setThreshold(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-success" disabled={saving}>
                {saving
                  ? <><span className="spinner-border spinner-border-sm me-2" />Guardando...</>
                  : 'Guardar'
                }
              </button>
            </form>
            <p className="text-muted small mt-3 mb-0">
              <i className="bi bi-info-circle me-1"></i>
              Actualmente, un producto aparece en stock bajo si tiene <strong>{threshold || '5'} unidades o menos</strong>.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;
