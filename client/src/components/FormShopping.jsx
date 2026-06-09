import Products from "../views/Products"

const FormShopping = () => {
    return (
        <>
            <div className='border border-secondary-subtle rounded p-4'>
                <div className='d-flex justify-content-between'>
                    <div>
                        <h3>Nueva Compra</h3>
                    </div>
                    <div>
                        <button type="button" className="btn-close" aria-label="Close"></button>
                    </div>
                </div>
                <form className="row g-3">
                    <div className="col-md-12 text-start">
                        <label for="inputProduct" className="form-label">Producto</label>
                        <select class="form-select" aria-label="Default select example">
                            <option selected>Seleccione un producto</option>
                            <option>{Products}</option>
                        </select>
                    </div>
                    <div className="col-md-12 text-start">
                        <label for="inputId" className="form-label">SKU</label>
                        <input type="id" className="form-control" id="inputId" />
                    </div>
                    <div className="col-md-6 text-start">
                        <label for="inputQuantity" className="form-label">Cantidad</label>
                        <input type="id" className="form-control" id="inputQuantity" />
                    </div>
                    <div className="col-md-6 text-start">
                        <label for="inputSupplier" className="form-label">Proveedor</label>
                        <input type="id" className="form-control" id="inputSupplier" />
                    </div>
                    <div className="col-md-6 text-start">
                        <label for="inputPurchasePrice" className="form-label">Precio de Compra</label>
                        <input type="text" className="form-control" id="inputPurchasePrice" />
                    </div>
                    <div className="col-md-6 text-start">
                        <label for="inputSalePrice" className="form-label">Precio de Venta</label>
                        <input type="text" className="form-control" id="inputSalePrice" />
                    </div>
                    <div className="col-md-12 text-start">
                        <label for="inputNotes" className="form-label">Notas</label>
                        <textarea class="form-control" id="inputNotes" rows="3"></textarea>
                    </div>
                    <div className="col-md-12 text-start">
                        <button type="submit" className="btn btn-success">Guardar</button>
                        <button type="submit" className="btn btn-danger ms-3">Cancelar</button>
                    </div>
                </form>
            </div>
        </>
    )
}

export default FormShopping
