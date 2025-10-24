import Coupon from '../models/coupon.model.js';

export const getCoupon = async (req, res) => {
  try {
    const coupons = await Coupon.find({
      userId: req.user._id,
      isActive: true, 
    });

    return res.status(200).json(coupons.length ? coupons : null);
  } catch (error) {
    console.error('Error fetching coupon:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};


export const validateCoupon = async (req, res) => {
  try {
    const { code } = req.query;

    const coupon = await Coupon.findOne({
      code,
      userId: req.user._id,
      isActive: true,
    });

    if (!coupon) {
      return res.status(404).json({ message: 'Invalid or expired coupon' });
    }

    if (coupon.expirationDate < new Date()) {
      coupon.isActive = false;
      await coupon.save();
      return res.status(400).json({ message: 'Coupon has expired' });
    }

    return res.status(200).json({
      message: 'Coupon is valid',
      code: coupon.code,
      discountPercentage: coupon.discountPercentage,
      expirationDate: coupon.expirationDate,
    });
  } catch (error) {
    console.error('Error validating coupon:', error.message);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
