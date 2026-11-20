
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../db/schemas/user.schema.js";
import Sale from "../db/schemas/sale.schema.js";

const router = Router();

/* crear usuario */
router.post('/create', async (req, res) => {
    const { user, apellido, email, pass } = req.body;

    try {
        if (!user || !pass) {
            return res.status(400).json({
                message: 'Faltan datos del usuario'
            });
        }

        const existe = await User.findOne({ user });

        if (existe) {
            return res.status(409).json({
                message: 'El usuario ya existe'
            });
        }

        const ultimo = await User.findOne().sort({ id_usuario: -1 });
        const id_usuario = ultimo ? ultimo.id_usuario + 1 : 1;

        const hashedPass = await bcrypt.hash(pass, 10);

        const nuevoUsuario = new User({
            id_usuario,
            user,
            apellido,
            email,
            pass: hashedPass,
            activo: true
        });

        await nuevoUsuario.save();

        res.status(201).json({
            message: 'Usuario creado correctamente'
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: 'Error al crear usuario'
        });
    }
});

/* iniciar sesión */
router.post('/login', async (req, res) => {
    const { user, pass } = req.body;

    try {
        if (!user || !pass) {
            return res.status(400).json({
                message: 'Faltan usuario o contraseña'
            });
        }

        const result = await User.findOne({
            user: user,
            activo: true
        });

        if (!result) {
            return res.status(401).json({
                message: 'Usuario o contraseña incorrectos'
            });
        }

        const controlPass = await bcrypt.compare(pass, result.pass);

        if (!controlPass) {
            return res.status(401).json({
                message: 'Usuario o contraseña incorrectos'
            });
        }

        /* generar JWT */
        const token = jwt.sign(
            {
                id_usuario: result.id_usuario,
                user: result.user
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: 'usuario encontrado',
            usuario: {
                id_usuario: result.id_usuario,
                user: result.user
            },
            token: token
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: 'Error del servidor'
        });
    }
});

/* verificar token y autorizar eliminación */
const verificarToken = async (req, res, next) => {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
        return res.status(401).json({
            message: 'Token requerido'
        });
    }

    try {
        const token = authorization.slice(7);
        const datos = jwt.verify(token, process.env.JWT_SECRET);

        const usuario = await User.findOne({
            id_usuario: datos.id_usuario,
            activo: true
        });

        if (!usuario) {
            return res.status(403).json({
                message: 'Usuario no autorizado'
            });
        }

        req.usuario = usuario;
        next();

    } catch (error) {
        return res.status(401).json({
            message: 'Token inválido o vencido'
        });
    }
};

/* eliminar usuario */
router.delete('/delete/:id', verificarToken, async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
        return res.status(400).json({
            message: 'ID incorrecto'
        });
    }

    /* solo puede intentar eliminar su propia cuenta */
    if (req.usuario.id_usuario !== id) {
        return res.status(403).json({
            message: 'No podés eliminar otro usuario'
        });
    }

    try {
        const tieneVentas = await Sale.exists({
            id_usuario: id
        });

        if (tieneVentas) {
            return res.status(409).json({
                message: 'El usuario tiene ventas'
            });
        }

        const result = await User.findOneAndDelete({
            id_usuario: id
        });

        if (result) {
            res.status(200).json({
                message: 'usuario eliminado'
            });
        } else {
            res.status(404).json({
                message: 'usuario no encontrado'
            });
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: 'Error del servidor'
        });
    }
});

export default router;
