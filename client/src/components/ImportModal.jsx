import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

const ACCEPTED = '.csv,.txt,.xlsx,.xls';

const readFileAsText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsText(file, 'UTF-8');
  });

const readFileAsBuffer = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });

const parseFile = async (file) => {
  const ext = file.name.split('.').pop().toLowerCase();

  if (ext === 'numbers') {
    throw new Error('El formato .numbers no es compatible. Exporta el archivo como .xlsx desde Numbers.');
  }

  if (ext === 'csv' || ext === 'txt') {
    const text = await readFileAsText(file);
    const clean = text.replace(/^﻿/, '');
    const lines = clean.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return { headers: [], rows: [] };
    const sep = lines[0].includes(';') ? ';' : '\t';
    const finalSep = lines[0].includes(sep) ? sep : ',';
    const splitLine = (line) => {
      const result = [];
      let current = '', inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
          else inQuotes = !inQuotes;
        } else if (ch === finalSep && !inQuotes) {
          result.push(current.trim()); current = '';
        } else { current += ch; }
      }
      result.push(current.trim());
      return result;
    };
    const headers = splitLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim());
    const rows = lines.slice(1).map(l => {
      const cols = splitLine(l).map(c => c.replace(/^"|"$/g, '').trim());
      const row = {};
      headers.forEach((h, i) => { row[h] = cols[i] ?? ''; });
      return row;
    }).filter(r => Object.values(r).some(v => v));
    return { headers, rows };
  }

  // xlsx / xls
  const buffer = await readFileAsBuffer(file);
  const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  if (data.length < 2) return { headers: [], rows: [] };
  const headers = data[0].map(h => String(h).trim()).filter(Boolean);
  const numCols = headers.length;
  const rows = data.slice(1)
    .filter(r => r.some(v => v !== '' && v !== null && v !== undefined))
    .map(r => {
      const row = {};
      headers.forEach((h, i) => {
        const raw = r[i];
        // Normalizar números: SheetJS devuelve number para celdas numéricas
        row[h] = raw !== undefined && raw !== null ? String(raw).trim() : '';
      });
      return row;
    })
    .filter(r => Object.values(r).some(v => v !== ''));
  return { headers, rows };
};

const ImportModal = ({ show, onClose, onImport, fields, title, importing }) => {
  const [step, setStep] = useState('upload');
  const [fileData, setFileData] = useState(null);
  const [mapping, setMapping] = useState({});
  const [error, setError] = useState('');
  const [parsing, setParsing] = useState(false);
  const fileRef = useRef(null);

  const reset = () => {
    setStep('upload');
    setFileData(null);
    setMapping({});
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleClose = () => { reset(); onClose(); };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    setParsing(true);
    try {
      const { headers, rows } = await parseFile(file);
      if (!headers.length) {
        setError('El archivo no tiene datos reconocibles.');
        setParsing(false);
        return;
      }
      // Auto-mapeo inteligente
      const autoMap = {};
      fields.forEach(field => {
        const terms = [field.key, ...(field.aliases || [])].map(t => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''));
        const match = headers.find(h => {
          const hn = h.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
          return terms.some(t => hn.includes(t) || t.includes(hn));
        });
        autoMap[field.key] = match || '';
      });
      setMapping(autoMap);
      setFileData({ headers, rows });
      setStep('map');
    } catch (err) {
      setError(err.message || 'Error al leer el archivo.');
    } finally {
      setParsing(false);
    }
  };

  const previewRows = fileData?.rows?.slice(0, 5) || [];
  const requiredMapped = fields.filter(f => f.required).every(f => mapping[f.key]);

  const handleConfirm = () => {
    const mapped = fileData.rows.map(row => {
      const out = {};
      fields.forEach(f => {
        out[f.key] = mapping[f.key] ? (row[mapping[f.key]] ?? '') : '';
      });
      return out;
    });
    onImport(mapped);
  };

  if (!show) return null;

  return (
    <div className="modal show d-block modal-overlay">
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button className="btn-close" onClick={handleClose} disabled={importing} />
          </div>
          <div className="modal-body">
            {step === 'upload' && (
              <div className="text-center py-4">
                <i className="bi bi-file-earmark-arrow-up fs-1 text-primary d-block mb-3"></i>
                <p className="text-muted mb-3">
                  Selecciona un archivo. Puedes usar <strong>.xlsx, .xls, .csv, .txt</strong>
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => fileRef.current?.click()}
                  disabled={parsing}
                >
                  {parsing
                    ? <><span className="spinner-border spinner-border-sm me-2" />Leyendo archivo...</>
                    : <><i className="bi bi-upload me-2" />Seleccionar archivo</>
                  }
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept={ACCEPTED}
                  className="d-none"
                  onChange={handleFile}
                />
                {error && <div className="alert alert-danger mt-3 text-start">{error}</div>}
              </div>
            )}

            {step === 'map' && fileData && (
              <>
                <p className="text-muted small mb-3">
                  <i className="bi bi-info-circle me-1"></i>
                  Se detectaron <strong>{fileData.headers.length}</strong> columnas y <strong>{fileData.rows.length}</strong> filas.
                  Indica qué columna del archivo corresponde a cada campo.
                </p>
                <div className="row g-3 mb-4">
                  {fields.map(field => (
                    <div key={field.key} className="col-md-6">
                      <label className="form-label small fw-semibold">
                        {field.label}
                        {field.required && <span className="text-danger ms-1">*</span>}
                      </label>
                      <select
                        className={`form-select form-select-sm ${field.required && !mapping[field.key] ? 'border-danger' : ''}`}
                        value={mapping[field.key] || ''}
                        onChange={e => setMapping({ ...mapping, [field.key]: e.target.value })}
                      >
                        <option value="">— No importar —</option>
                        {fileData.headers.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                {previewRows.length > 0 && (
                  <>
                    <p className="small fw-semibold text-muted mb-2">Vista previa (primeras {previewRows.length} filas):</p>
                    <div className="table-responsive">
                      <table className="table table-sm table-bordered import-preview-table">
                        <thead>
                          <tr>
                            {fields.filter(f => mapping[f.key]).map(f => (
                              <th key={f.key}>{f.label}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewRows.map((row, i) => (
                            <tr key={i}>
                              {fields.filter(f => mapping[f.key]).map(f => (
                                <td key={f.key}>{row[mapping[f.key]] ?? ''}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          <div className="modal-footer">
            {step === 'map' && (
              <button
                className="btn btn-sm btn-outline-secondary me-auto"
                onClick={reset}
                disabled={importing}
              >
                <i className="bi bi-arrow-left me-1"></i>Cambiar archivo
              </button>
            )}
            <button className="btn btn-danger" onClick={handleClose} disabled={importing}>
              Cancelar
            </button>
            {step === 'map' && (
              <button
                className="btn btn-success"
                onClick={handleConfirm}
                disabled={!requiredMapped || importing}
              >
                {importing
                  ? <><span className="spinner-border spinner-border-sm me-2" />Importando...</>
                  : <><i className="bi bi-check-lg me-1"></i>Importar {fileData?.rows?.length} registros</>
                }
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
