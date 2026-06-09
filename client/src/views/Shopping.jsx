import React from 'react'
import FormShopping from '../components/FormShopping'

const Shopping = () => {
  return (
    <>
      <div className='d-flex justify-content-between'>
        <div>
          <h5 className="text-2xl font-bold mb-4">Compras</h5>
        </div>
        <div className='text-end mb-3'>
          <button className='btn btn-primary' onClick={FormShopping}>+ Nuevo Compra</button>
        </div>
      </div>
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-100">
          <thead className="dash">
            <tr>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">SKU</th>
              <th className="px-4 py-2">Producto</th>
              <th className="px-4 py-2">Cantidad</th>
              <th className="px-4 py-2">P. Compra</th>
              <th className="px-4 py-2">P. venta</th>
              <th className="px-4 py-2">Ganancia</th>
              <th className="px-4 py-2">Proveedor</th>
            </tr>
          </thead>
          <tbody>
            <td className='text-center px-4 py-5 text-secondary' colSpan={8}>
              No hay compras registradas
            </td>
          </tbody>
        </table>
      </div>
    </>
  )
}

export default Shopping
