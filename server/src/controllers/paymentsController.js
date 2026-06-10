import * as paymentModel from "../models/paymentsModel.js";
import * as auditModel from "../models/auditModel.js";

export const getPayments = async (req, res) => {
  try {
    const payments = await paymentModel.getAllPayments();
    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los pagos" });
  }
};

export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await paymentModel.getPaymentById(id);
    if (!payment) return res.status(404).json({ error: "Pago no encontrado" });
    res.json(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el pago" });
  }
};

export const getPaymentsBySaleId = async (req, res) => {
  try {
    const { sale_id } = req.params;
    const payments = await paymentModel.getPaymentsBySaleId(sale_id);
    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los pagos de la venta" });
  }
};

export const createPayment = async (req, res) => {
  try {
    const { sale_id, amount, method } = req.body;
    if (!sale_id) return res.status(400).json({ error: "sale_id es obligatorio" });
    if (!amount) return res.status(400).json({ error: "amount es obligatorio" });
    const payment = await paymentModel.createPayment({ sale_id, amount, method });
    res.status(201).json(payment);

    auditModel.createAuditLog({
      admin_id: req.admin?.id || null,
      action: 'CREATE',
      table_name: 'payments',
      record_id: payment.id,
      description: `Registró pago de $${payment.amount} para venta ID ${payment.sale_id}`,
    }).catch(() => {});
  } catch (error) {
    console.error(error);
    if (error.code === "23503") return res.status(400).json({ error: "La venta especificada no existe" });
    if (error.code === "23514") return res.status(400).json({ error: "Método de pago inválido o monto debe ser mayor a 0" });
    res.status(500).json({ error: "Error al registrar el pago" });
  }
};

export const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await paymentModel.getPaymentById(id);
    if (!payment) return res.status(404).json({ error: "Pago no encontrado" });
    await paymentModel.deletePayment(id);
    res.json({ message: "Pago eliminado correctamente" });

    auditModel.createAuditLog({
      admin_id: req.admin?.id || null,
      action: 'DELETE',
      table_name: 'payments',
      record_id: parseInt(req.params.id),
      description: `Eliminó pago ID ${req.params.id}`,
    }).catch(() => {});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar el pago" });
  }
};
