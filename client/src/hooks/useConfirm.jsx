import { useState, useCallback } from 'react';

const useConfirm = () => {
  const [state, setState] = useState({ show: false, message: '', resolve: null });

  const ask = useCallback((message) => {
    return new Promise((resolve) => {
      setState({ show: true, message, resolve });
    });
  }, []);

  const handleConfirm = () => {
    state.resolve(true);
    setState({ show: false, message: '', resolve: null });
  };

  const handleCancel = () => {
    state.resolve(false);
    setState({ show: false, message: '', resolve: null });
  };

  const confirmModal = (
    <div
      className={`modal fade ${state.show ? 'd-block show' : ''}`}
      style={{ background: state.show ? 'rgba(0,0,0,0.5)' : 'none' }}
      tabIndex={-1}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-body py-4 text-center">
            <i className="bi bi-exclamation-triangle text-warning fs-2 d-block mb-3"></i>
            <p className="mb-0">{state.message}</p>
          </div>
          <div className="modal-footer justify-content-center border-0 pt-0">
            <button type="button" className="btn btn-outline-secondary" onClick={handleCancel}>
              Cancelar
            </button>
            <button type="button" className="btn btn-danger" onClick={handleConfirm}>
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return { confirmModal, ask };
};

export default useConfirm;
