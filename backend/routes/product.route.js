import express from 'express';
import {
  getAllProducts,
  getFeaturedProducts,
  createProduct,
  deleteProduct,
  getRecommendedProducts,
  getProductByCategory,
  toggleFeaturedProduct 
} from '../controllers/product.controller.js';
import { protectedRoute, adminRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protectedRoute, adminRoute, getAllProducts);
router.get('/featured', getFeaturedProducts);
router.get('/recommendations', getRecommendedProducts);
router.get('/category/:category', getProductByCategory);
router.post('/', protectedRoute, adminRoute, createProduct);
router.patch('/:id', protectedRoute, adminRoute, toggleFeaturedProduct);
router.delete('/:id', protectedRoute, adminRoute, deleteProduct);

export default router;
