import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.route.js';
import { connectDB } from './lib/db.js';
import cookieParser from 'cookie-parser';

dotenv.config();
const app = express();
app.use(express.json());          // allow us to parse body of the reesponse or request as json
app.use(cookieParser());      // to parse cookies from incoming requests


app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 3000;



console.log('Starting server...'); 
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
    connectDB();
});
