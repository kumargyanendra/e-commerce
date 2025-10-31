import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.route.js';
import productRoutes from './routes/product.route.js';
import cartRoutes from './routes/cart.route.js';
import couponRoutes from './routes/coupon.route.js';
import paymentRoutes from './routes/payment.route.js';
import { connectDB } from './lib/db.js';
import cookieParser from 'cookie-parser';

dotenv.config();
const app = express();
app.use(express.json());          // allow us to parse body of the reesponse or request as json
app.use(cookieParser());      // to parse cookies from incoming requests


app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/coupon', couponRoutes);
app.use('/api/payments', paymentRoutes); 

const PORT = process.env.PORT || 3000;


app.get('/', (req, res) => {
  res.send('Welcome to the E-commerce API, backend working prpoperly!');
});


console.log('Starting server...'); 
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
    connectDB();
});
