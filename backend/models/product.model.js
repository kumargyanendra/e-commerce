import mongoose from 'mongoose';

const producrSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    image:{
        
        type: String,
        required: [true, 'Image is required'],
    },

    category:{
        type: String,
        required: true,
    }, 
    isfeatured: {
        type: Boolean,
        default: false,
    },

    }, { timestamps: true });

    const Product = mongoose.model('Product', producrSchema);

    export default Product;