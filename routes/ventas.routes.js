
import { Router } from "express";
import jwt from "jsonwebtoken";
import Sale from "../db/schemas/sale.schema.js";
import User from "../db/schemas/user.schema.js";
import Product from "../db/schemas/product.schema.js";

const router = Router();

/* consultar ventas por fechas */
router.post('/fechas', async (req, res) => {
    const { desde, hasta } = req.body;

    try {
        if (!desde || !hasta) {
            return res.status(400).json({
                message: 'Faltan las fechas'
            });
        }

        const result = await Sale.find({
            fecha: { $gte: desde, $lte: hasta }
        });

        if (result.length > 0) {
            res.status(200).json(result);
        } else {
            res.status(404).json({
                message: 'No hay ventas disponibles'
            });
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: 'Error del servidor'
        });
    }
});

/* consultar ventas impagas */
router.get('/impagas', async (req, res) => {
    try {
        const result = await Sale.find({
            pagada: false
        });

        res.status(200).json(result);

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: 'Error del servidor'
        });
    }
});

/* realizar una compra */
router.post('/comprar', async (req, res) => {

    /* obtener el token */
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
        return res.status(401).json({
            message: 'Token requerido'
        });
    }

    const token = authorization.slice(7);

    let datosUsuario;

    /* verificar JWT */
    try {
        datosUsuario = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return res.status(401).json({
            message: 'Token inválido o vencido'
        });
    }

    try {
        /* comprobar que el usuario esté activo */
        const usuario = await User.findOne({
            id_usuario: datosUsuario.id_usuario,
            activo: true
        });

        if (!usuario) {
            return res.status(403).json({
                message: 'Usuario no autorizado'
            });
        }

        /* obtener los productos y la dirección */
        const { productos, dirección } = req.body;

        if (
            !Array.isArray(productos) ||
            productos.length === 0 ||
            !productos.every(id => Number.isInteger(id))
        ) {
            return res.status(400).json({
                message: 'Productos incorrectos'
            });
        }

        /* buscar los productos en MongoDB */
        const productosDB = await Product.find({
            id_producto: { $in: productos },
            disponible: true
        });

        /* comprobar que todos existan */
        const todosExisten = productos.every(id =>
            productosDB.some(p => p.id_producto === id)
        );

        if (!todosExisten) {
            return res.status(400).json({
                message: 'Hay productos inexistentes o no disponibles'
            });
        }

        /* calcular el total de la compra */
        const total = productos.reduce((suma, id) => {
            const producto = productosDB.find(p => p.id_producto === id);
            return suma + producto.precio;
        }, 0);

        /* obtener el número de la nueva venta */
        const ultima = await Sale.findOne().sort({ id_venta: -1 });

        const id_venta = ultima ? ultima.id_venta + 1 : 1001;

        /* crear la venta */
        const nuevaVenta = new Sale({
            id_venta,
            id_usuario: usuario.id_usuario,
            fecha: new Date().toISOString().slice(0, 10),
            total,
            dirección,
            productos,
            pagada: false
        });

        /* guardar en MongoDB */
        await nuevaVenta.save();

        res.status(201).json({
            message: 'Orden creada',
            orden: nuevaVenta
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: 'Error al crear la venta'
        });
    }
});

export default router;
