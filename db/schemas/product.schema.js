
import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

const ProductSchema = new Schema({
    id_producto: {type: Number, required: true, unique: true},
    nombre: {type: String, required: true},
    desc: {type: String, required: true},
    precio: {type: Number, required: true},
    imagen: {type: String},
    categoria: {type: String, required: true},
    disponible: {type: Boolean, default: true}
})

const Product = models.products || model('products', ProductSchema)

export default Product
