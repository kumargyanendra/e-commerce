import express from 'express';
const router = express.Router();

import { protectedRoute } from '../middleware/auth.middleware.js';

import { addToCart,
        removeAllFromCart,
        updateQuantity,
        getCartProducts
 } from '../controllers/cart.controller.js';


router.post("/",protectedRoute,addToCart);
router.get("/",protectedRoute,getCartProducts);
router.delete("/",protectedRoute,removeAllFromCart);
router.put("/",protectedRoute,updateQuantity);


export default router;