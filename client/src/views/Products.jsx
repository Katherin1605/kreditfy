import FormProducts from "../components/FormProducts"
const Products = () => {
  return (
    <>
      <div className='d-flex justify-content-between'>
        <div>
          <h5 className="text-2xl font-bold mb-4">Productos</h5>
        </div>
        <div className='text-end mb-3'>
          <button className='btn btn-primary' onClick={FormProducts}>+ Nuevo Producto</button>
        </div>
      </div>
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-100">
          <thead className="bg-secondary bg-opacity-10">
            <tr>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">SKU</th>
              <th className="px-4 py-2">Descripción</th>
              <th className="px-4 py-2">Precio</th>
              <th className="px-4 py-2">Stock</th>
              <th className="px-4 py-2">Stock Mín.</th>
              <th className="px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <td className='text-center px-4 py-5 text-secondary' colSpan={7}>
              No hay productos registrados
            </td>
          </tbody>
        </table>
      </div>
    </>
  )
}

export default Products
