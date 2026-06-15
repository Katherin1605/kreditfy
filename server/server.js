import express from 'express';
import cors from 'cors';
import 'dotenv/config';
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


const PORT = process.env.PORT;
const app = express();

// Middelwares

app.use(cors());
app.use(express.json())
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


// Routes

app.get("/", (req, res) => {
  res.send("API funcionando 🚀");
});


// app.use();

app.listen(PORT, () => {
    console.log(`🔋 🔥 Servidor corriendo en puerto http://localhost:${PORT}`);
})
