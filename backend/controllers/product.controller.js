import Product from '../models/product.model.js';
import { redis } from '../lib/redis.js';
import cloudinary from '../lib/cloudinary.js';

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({}); // Fetch all products from the database
    return res.status(200).json(products);
  } catch (error) {
    console.error(error.message, 'error in getAllProducts route');
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    let featuredProducts = await redis.get('featuredProducts');

    if (featuredProducts) {
      console.log('Fetching featured products from cache');
      return res.status(200).json(JSON.parse(featuredProducts));
    }

    console.log('Fetching featured products from database');
    const products = await Product.find({ isFeatured: true }).lean(); //plain JavaScript object me convert kar deta hai,
    // Cache for 1 hour (3600 seconds)
    await redis.set('featuredProducts', JSON.stringify(products));

    return res.status(200).json(products);
  } catch (error) {
    console.error('Error in getFeaturedProducts route:', error.message);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, image, category } = req.body;

    let cloudinaryResponse = null;
    if (image) {
      cloudinaryResponse = await cloudinary.uploader.upload(image, {
        folder: 'products',
      });
    }

    const newProduct = new Product({
      name,
      description,
      price,
      category,
      image: cloudinaryResponse?.secure_url || null,
    });

    const savedProduct = await newProduct.save();
    return res.status(201).json(savedProduct);
  } catch (error) {
    console.error('Error in createProduct route:', error.message);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Delete image from Cloudinary if exists
    if (product.image) {
      try {
        const parts = product.image.split('/');
        const filename = parts[parts.length - 1]; // e.g. "abc123.jpg"
        const publicId = filename.split('.')[0]; // e.g. "abc123"
        await cloudinary.uploader.destroy(`products/${publicId}`);
        console.log('Image deleted from Cloudinary');
      } catch (err) {
        console.error('Error deleting image from Cloudinary:', err.message);
        // continue to delete DB record even if cloudinary delete fails
      }
    }

    // Delete product from DB
    await product.deleteOne(); // or await Product.findByIdAndDelete(productId);

    return res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error in deleteProduct route:', error.message);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const getRecommendedProducts = async (req, res) => {
  try {
    const recommendedProducts = await Product.aggregate([
      { $sample: { size: 5 } },
      { $project: { name: 1, price: 1, image: 1, category: 1 } },
    ]);

    return res.status(200).json(recommendedProducts);
  } catch (error) {
    console.error('Error in getRecommendedProducts route:', error.message);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const getProductByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const products = await Product.find({ category }).lean();

    if (!products.length) {
      return res.status(404).json({ message: 'No products found in this category' });
    }

    return res.status(200).json(products);
  } catch (error) {
    console.error('Error in getProductByCategory route:', error.message);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const toggleFeaturedProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.isfeatured = !product.isfeatured;
    const updatedProduct = await product.save();

    await updateFeaturedProductsCache();

    return res.status(200).json(updatedProduct);
  } catch (error) {
    console.error('Error in toggleFeaturedProduct route:', error.message);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

async function updateFeaturedProductsCache() {
  try {
    const featuredProducts = await Product.find({ isFeatured: true }).lean();
    await redis.set('featuredProducts', JSON.stringify(featuredProducts), 'EX', 3600);
    console.log('Featured products cache updated');
  } catch (error) {
    console.error('Error updating featured products cache:', error.message);
  }
}
