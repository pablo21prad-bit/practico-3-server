Hola profe, para esta entrega usé el back del práctico anterior y le agregué lo necesario para conectarlo con el front.

En user.routes.js está el login, que busca el usuario y la contraseña. Si el usuario está activo, devuelve sus datos para poder hacer la compra.

En productos.routes.js agregué una ruta para mostrar todos los productos y otra para filtrarlos por categoría. También quedó la ruta para modificar los precios.

En ventas.routes.js agregué /comprar, que recibe el usuario, los productos del carrito, la fecha y el total. Después guarda la orden en ventas.json con un id y como no pagada.

Los datos se siguen guardando en archivos JSON. Elegí multirepo, por eso el back y el front están en repositorios separados.

Para levantar el servidor hay que ejecutar npm install y después npm start. Funciona en el puerto 3001.