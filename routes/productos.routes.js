
import { Router } from "express";
import jwt from "jsonwebtoken";
import Product from "../db/schemas/product.schema.js";
import User from "../db/schemas/user.schema.js";
import Sale from "../db/schemas/sale.schema.js";

const router = Router();

/* verificar el token */
const verificarToken = async (req, res, next) => {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Token requerido"
        });
    }

    let datos;

    try {
        const token = authorization.slice(7);
        datos = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return res.status(401).json({
            message: "Token inválido o vencido"
        });
    }

    try {
        const usuario = await User.findOne({
            id_usuario: datos.id_usuario,
            activo: true
        });

        if (!usuario) {
            return res.status(403).json({
                message: "Usuario no autorizado"
            });
        }

        req.usuario = usuario;
        next();

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Error del servidor"
        });
    }
};

/* CREATE - crear producto */
router.post('/create', verificarToken, async (req, res) => {
    const { nombre, desc, precio, imagen, categoria, disponible } = req.body;

    try {
        if (!nombre || !desc || !categoria ||
            typeof precio !== "number" ||
            !Number.isFinite(precio) || precio < 0) {
            return res.status(400).json({
                message: "Datos incorrectos"
            });
        }

        const ultimo = await Product.findOne().sort({ id_producto: -1 });

        const id_producto = ultimo ? ultimo.id_producto + 1 : 101;

        const nuevoProducto = new Product({
            id_producto,
            nombre,
            desc,
            precio,
            imagen,
            categoria,
            disponible: disponible ?? true
        });

        await nuevoProducto.save();

        res.status(201).json({
            message: "Producto creado correctamente",
            producto: nuevoProducto
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Error al crear producto"
        });
    }
});

/* READ - mostrar todos los productos */
router.get('/', async (req, res) => {
    try {
        const productos = await Product.find().select('-_id -__v');

        res.status(200).json(productos);

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Error al obtener productos"
        });
    }
});

/* READ - productos disponibles */
router.get('/disponibles', async (req, res) => {
    try {
        const productos = await Product.find({
            disponible: true
        });

        const result = productos.map(e => ([e.nombre, e.precio]));

        if (result.length > 0) {
            res.status(200).json(result);
        } else {
            res.status(404).json({
                message: "No hay productos disponibles"
            });
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Error del servidor"
        });
    }
});

/* READ - buscar por categoría */
router.get('/categoria/:categoria', async (req, res) => {
    const categoria = req.params.categoria;

    try {
        const result = await Product.find({
            categoria: categoria
        }).select('-_id -__v');

        res.status(200).json(result);

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Error del servidor"
        });
    }
});

/* UPDATE - modificar precio */
router.put('/precio/update/:id', verificarToken, async (req, res) => {
    const id = Number(req.params.id);
    const newPrecio = req.body.precio;

    if (!Number.isInteger(id) ||
        typeof newPrecio !== "number" ||
        !Number.isFinite(newPrecio) || newPrecio < 0) {
        return res.status(400).json({
            message: "ID o precio incorrecto"
        });
    }

    try {
        const result = await Product.findOneAndUpdate(
            { id_producto: id },
            { precio: newPrecio },
            { new: true, runValidators: true }
        );

        if (result) {
            res.status(200).json({
                message: "PRECIO MODIFICADO"
            });
        } else {
            res.status(404).json({
                message: "Producto no encontrado"
            });
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Error del servidor"
        });
    }
});

/* DELETE - eliminar producto */
router.delete('/delete/:id', verificarToken, async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
        return res.status(400).json({
            message: "ID incorrecto"
        });
    }

    try {
        const tieneVentas = await Sale.exists({
            productos: id
        });

        if (tieneVentas) {
            return res.status(409).json({
                message: "El producto tiene ventas registradas"
            });
        }

        const result = await Product.findOneAndDelete({
            id_producto: id
        });

        if (result) {
            res.status(200).json({
                message: "Producto eliminado correctamente"
            });
        } else {
            res.status(404).json({
                message: "Producto no encontrado"
            });
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Error al eliminar producto"
        });
    }
});

export default router;
