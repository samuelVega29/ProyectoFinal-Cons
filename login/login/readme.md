Integrantes:
- Sebastian Ruiz

# instalaciones:

npm install express multer csv-parser mysql2
npm install bcrypt
npm install ejs


# base de datos

CREATE DATABASE IF NO EXIST bd_usuarios;
USE bd_usuarios;

CREATE TABLE usuarios (
	id INTEGER auto_increment PRIMARY KEY,
	identificacion VARCHAR(50) UNIQUE NOT NULL,
	nombre_usuario VARCHAR(50) NOT NULL,
	apellido_usuario VARCHAR(50) NOT NULL,
	rol ENUM('Administrador', 'Docente', 'Estudiante'),
	genero ENUM('Masculino', 'Femenino', 'Otro'),
	contrasenna VARCHAR(255) NOT NULL,
	fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

# ejs: 
EJS (Embedded JavaScript) es un motor de plantillas que permite generar HTML dinámico en aplicaciones web utilizando JavaScript. 

* La sintaxis de EJS:
Permite insertar variables y estructuras de control directamente en el HTML:
* utilizando los delimitadores: <%= %> para la salida de variables y <% %> para ejecutar código JavaScript.
* Por ejemplo:
 <%= user.name %> inserta el nombre del usuario en la página, y el código <% users.forEach(user => { %> permite iterar sobre un array de usuarios.

