import * as platformModel from "../models/platformModel.js";
import { uploadToCloudinary } from "../utils/cloudinaryConfig.js";
import { uploadLogo as multerUpload } from "../utils/upload.js";

export const getSettings = async (req, res) => {
  try {
    const settings = await platformModel.getTenantSettings(req.tenantId);
    res.json(settings ?? { low_stock_threshold: 5, logo_url: null });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener configuración" });
  }
};

export const updateLowStockThreshold = async (req, res) => {
  try {
    const { low_stock_threshold } = req.body;
    const threshold = parseInt(low_stock_threshold);
    if (isNaN(threshold) || threshold < 1 || threshold > 9999) {
      return res.status(400).json({ error: "El umbral debe ser un número entre 1 y 9999" });
    }
    const result = await platformModel.updateTenantSettings(req.tenantId, { low_stock_threshold: threshold });
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar configuración" });
  }
};

export const uploadLogo = [
  multerUpload.single('logo'),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No se recibió ningún archivo" });
      const result = await uploadToCloudinary(req.file.buffer, 'kreditfy/logos');
      await platformModel.updateTenantLogoById(req.tenantId, result.secure_url);
      res.json({ logo_url: result.secure_url });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error al subir el logo" });
    }
  },
];
