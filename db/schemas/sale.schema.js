
import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

const SalesSchema = new Schema({
    id_venta: {type: Number, required: true, unique: true},
    id_usuario: {type: Number, required: true},
    fecha: {type: String, required: true},
    total: {type: Number, required: true},
    dirección: {type: String},
    productos: [{type: Number, required: true}],
    pagada: {type: Boolean, default: false}
}, {timestamps: true})

const Sales = models.sales || model('sales', SalesSchema)

export default Sales
