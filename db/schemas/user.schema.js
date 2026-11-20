
import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

const UserSchema = new Schema({
    id_usuario: {type: Number, required: true, unique: true},
    user: {type: String, required: true, unique: true},
    apellido: {type: String},
    email: {type: String},
    pass: {type: String, required: true},
    activo: {type: Boolean, default: true}
})

const User = models.user || model('user', UserSchema)

export default User
