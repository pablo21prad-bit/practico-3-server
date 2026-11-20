
/* importamos las variables de entorno */
import 'dotenv/config';

/* importamos express */
import express from "express";
import cors from "cors";

/* importamos las rutas */
import UserRouter from "./routes/user.routes.js";
import ProductosRouter from "./routes/productos.routes.js";
import ventasRouter from "./routes/ventas.routes.js";

/* importamos la conexión a MongoDB */
import { connectToDatabase } from "./db/connection.js";

/* creamos una instancia de express */
const app = express();

/* configuramos el servidor */
app.use(cors());
app.use(express.json());

/* obtenemos el puerto desde el archivo .env */
const PORT = process.env.PORT;

/* ruta principal */
app.get("/", (req, res) => {
    res.send("hola");
});

/* rutas de usuario, productos y ventas */
app.use("/users", UserRouter);
app.use("/productos", ProductosRouter);
app.use("/ventas", ventasRouter);

/* conectamos MongoDB y levantamos el servidor */
try {
    await connectToDatabase();

    console.log("MongoDB conectado correctamente");

    app.listen(PORT, () => {
        console.log(`Servidor levantado en el puerto ${PORT}`);
    });

} catch (error) {
    console.log("Error al conectar con MongoDB:", error);
    process.exit(1);
}
