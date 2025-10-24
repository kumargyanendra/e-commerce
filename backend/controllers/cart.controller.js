import Product from '../models/product.model.js';

export const getCartProducts = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.cart) {
      return res.status(400).json({ message: 'No cart found for user' });
    }

    const productIds = user.cart.map(item => item.productId);
    const products = await Product.find({ _id: { $in: productIds } }).lean();

    const cartDetails = products.map(prod => {
      const quantity = user.cart.find(item => item.productId.toString() === prod._id.toString()).quantity;
      return { product: prod, quantity };
    });

    return res.status(200).json({ cart: cartDetails });
  } catch (err) {
    console.error('Error in getCartProducts:', err.message);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ message: 'productId is required' });

    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    // ensure product exists (optional but recommended)
    const product = await Product.findById(productId).select('_id');
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const existingItem = user.cart.find(item => item.productId.toString() === productId.toString());
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      user.cart.push({ productId, quantity: 1 });
    }

    await user.save();
    return res.status(200).json({ message: 'Product added to cart successfully', cart: user.cart });
  } catch (err) {
    console.error('Error in addToCart:', err.message);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const removeAllFromCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    if (!productId) {
      user.cart = [];
    } else {
      user.cart = user.cart.filter(item => item.productId.toString() !== productId.toString());
    }

    await user.save();
    return res.status(200).json({ message: 'Products removed from cart successfully', cart: user.cart });
  } catch (err) {
    console.error('Error in removeAllFromCart:', err.message);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const updateQuantity = async (req, res) => {
  try {
    const { id: productId, quantity } = req.body;
    if (!productId) return res.status(400).json({ message: 'productId is required' });

    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const productInCart = user.cart.find(item => item.productId.toString() === productId.toString());
    if (!productInCart) return res.status(404).json({ message: 'Product not found in cart' });

    if (Number(quantity) === 0) {
      user.cart = user.cart.filter(item => item.productId.toString() !== productId.toString());
    } else {
      productInCart.quantity = Number(quantity);
    }

    await user.save();
    return res.status(200).json({ message: 'Cart updated successfully', cart: user.cart });
  } catch (err) {
    console.error('Error in updateQuantity:', err.message);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
