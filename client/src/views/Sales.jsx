import React from 'react'
import FormSales from '../components/FormSales'

const Sales = () => {
  return (
    <>
      <div className='d-flex justify-content-between'>
        <div>
          <h5 className="text-2xl font-bold mb-4">Ventas</h5>
        </div>
        <div className='text-end mb-3'>
          <button className='btn btn-primary' onClick={FormSales}>+ Nueva Venta</button>
        </div>
      </div>
      <div className="rounded shadow overflow-hidden">
        <table className="w-100">
          <thead className="dash">
            <tr>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Cliente</th>
              <th className="px-4 py-2">Total</th>
              <th className="px-4 py-2">Cuotas</th>
              <th className="px-4 py-2">Pagado</th>
              <th className="px-4 py-2">Saldo</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <td className='text-center px-4 py-5 text-secondary' colSpan={8}>
              No hay ventas registradas
            </td>
          </tbody>
        </table>
      </div>
    </>
  )
}

export default Sales
