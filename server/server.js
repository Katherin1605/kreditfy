import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import cron from 'node-cron';
import { runFullBackup } from './src/utils/backup.js';
import authRoutes from './routes/authRoutes.js';
import customersRoutes from './routes/customersRoutes.js';
import salesRoutes from './routes/salesRoutes.js';
import productsRoutes from './routes/productsRoutes.js';
import paymentsRoutes from './routes/paymentsRoutes.js';
import shoppingRoutes from './routes/shoppingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import earningsRoutes from './routes/earningsRoutes.js';
import exchangeRatesRoutes from './routes/exchangeRatesRoutes.js';
import platformRoutes from './routes/platformRoutes.js';


const PORT = process.env.PORT;
const app = express();

// Middelwares

const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:5173'];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static('public/uploads'));
app.use(authRoutes);
app.use(customersRoutes);
app.use(salesRoutes);
app.use(productsRoutes);
app.use(paymentsRoutes);
app.use(shoppingRoutes);
app.use(adminRoutes);
app.use(auditRoutes);
app.use(dashboardRoutes);
app.use(earningsRoutes);
app.use(exchangeRatesRoutes);
app.use(platformRoutes);


// Routes

app.get("/", (req, res) => {
  res.send("API funcionando 🚀");
});


// app.use();

app.listen(PORT, () => {
    console.log(`🔋 🔥 Servidor corriendo en puerto http://localhost:${PORT}`);
});

// Backup completo automático diario a las 2:00 AM
cron.schedule('0 2 * * *', async () => {
  try {
    const result = await runFullBackup();
    console.log(`✅ Backup automático completado: ${result.filename} (${result.size_mb} MB)`);
  } catch (err) {
    console.error('❌ Error en backup automático:', err.message);
  }
});
