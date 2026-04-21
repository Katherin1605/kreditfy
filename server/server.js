import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import customersRoutes from './routes/customersRoutes.js';
import salesRoutes from './routes/salesRoutes.js';


const PORT = process.env.PORT;
const app = express();

// Middelwares

app.use(cors());
app.use(express.json())
app.use(customersRoutes);
app.use(salesRoutes);


// Routes

app.get("/", (req, res) => {
  res.send("API funcionando 🚀");
});


// app.use();

app.listen(PORT, () => {
    console.log(`🔋 🔥 Servidor corriendo en puerto http://localhost:${PORT}`);
})
