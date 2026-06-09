import React from 'react'
import Customers from '../views/Customers'
import Products from '../views/Products'

const FormSales = () => {
    return (
        <>
            <div className='border border-secondary-subtle rounded p-4'>
                <div className='d-flex justify-content-between'>
                    <div>
                        <h3>Nueva Venta</h3>
                    </div>
                    <div>
                        <button type="button" className="btn-close" aria-label="Close"></button>
                    </div>
                </div>
                <form className="row g-3">
                    <div className="col-md-6 text-start">
                        <label for="inputName" className="form-label">Cliente</label>
                        <input type="name" className="form-control" id="inputName" placeholder='Buscar cliente por nombre o cédula' />
                    </div>
                    <div className="col-md-6 text-start">
                        <label for="inputId" className="form-label">Fecha de Venta</label>
                        <input type="id" className="form-control" id="inputId" />
                    </div>
                    <div className="col-md-6 text-start">
                        <select class="form-select" aria-label="Default select example">
                            <option selected>Seleccione un cliente</option>
                            <option>{Customers}</option>
                        </select>
                    </div>
                    <div className="col-md-12 text-start">
                        <label for="inputQuotas" className="form-label">Número de Cuotas</label>
                        <input type="text" className="form-control" id="inputQuotas" />
                    </div>

                    
                    <div className="col-md-12 text-start">
                        <label for="inputProducts" className="form-label">Agregar Productos</label>
                        <input type="text" className="form-control" id="inputProducts" />
                    </div>
                    <div className="col-md-8 text-start">
                        <select class="form-select" aria-label="Default select example">
                            <option selected>Seleccione un producto</option>
                            <option>{Products}</option>
                        </select>
                    </div>
                    <div className="col-md-2 text-start">
                        <input type="text" className="form-control" id="inputProducts" placeholder='1' />
                    </div>
                    <div className="col-md-2 text-start">
                        <button type="submit" className="btn btn-success">Agregar</button>
                    </div>
                    <div className="col-md-12 text-start">
                        <button type="submit" className="btn btn-success">Guardar Venta</button>
                        <button type="submit" className="btn btn-danger ms-3">Cancelar</button>
                    </div>
                </form>
            </div>
        </>
    )
}

export default FormSales
