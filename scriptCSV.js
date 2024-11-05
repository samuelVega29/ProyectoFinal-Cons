// Importar las dependencias necesarias
const express = require('express'); // Framework para crear el servidor web
const multer = require('multer'); // Middleware para manejar la subida de archivos
const csv = require('csv-parser'); // Módulo para analizar archivos CSV
const fs = require('fs'); // Módulo para manipulación de archivos del sistema
const mysql = require('mysql2'); // Cliente para conectarse a MySQL
const bcrypt = require('bcrypt'); // Módulo para encriptar contraseñas
const path = require('path'); // Módulo para manejar rutas de archivos
const bodyParser = require('body-parser');
const connection = require("./db");

// Crear una aplicación Express
const app = express();
const port = 3000; // Definir el puerto en el que se ejecutará el servidor

// Configurar multer para almacenar archivos CSV
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Carpeta donde se guardan los archivos subidos
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname); // Obtener la extensión del archivo
        cb(null, Date.now() + ext); // Guardar el archivo con un nombre único basado en la fecha y hora
    }
});

const upload = multer({ storage: storage }); 


app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('csv'));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'indexCsvv.html')); // Asegúrate de que 'index.html' esté en la carpeta 'public'
});


// Función para verificar si el número de identificación ya existe en la base de datos
const checkIfIdExists = (identificacion) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM usuarios WHERE identificacion = ?'; // Consulta SQL para buscar la identificación
        connection.query(query, [identificacion], (err, results) => {
            if (err) return reject(err); // Rechazar la promesa si hay un error
            resolve(results.length > 0); // Retornar true si hay resultados (la identificación existe)
        });
    });
};

// Función para insertar una persona en la base de datos
const insertPerson = (identificacion, nombre_usuario, apellido_usuario, rol, genero, email, hashedPassword) => {
    return new Promise((resolve, reject) => {
        const query = 'INSERT INTO usuarios (identificacion, nombre_usuario, apellido_usuario, rol, genero, email, contrasenna) VALUES (?, ?, ?, ?, ?, ?, ?)'; // Consulta SQL para insertar una persona
        connection.query(query, [identificacion, nombre_usuario, apellido_usuario, rol, genero, email.toLowerCase(), hashedPassword], (err) => {
            if (err) return reject(err); // Rechazar la promesa si hay un error
            resolve(); // Resolver la promesa si la inserción es exitosa
        });
    });
};

// Función para validar el formato de un correo electrónico
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Expresión regular para validar correos
    return emailRegex.test(email); // Retorna true si el correo es válido
};

// Función para validar el rol de un usuario
const isValidRole = (rol) => {
    return rol === 'Administrador' || rol === 'Docente' || rol === 'Estudiante'; // Retorna true si el rol es válido
};

// Ruta para procesar el archivo CSV subido
app.post('/upload', upload.single('csvfile'), (req, res) => {
    const filePath = req.file.path; // Obtener la ruta del archivo subido
    const results = []; // Array para almacenar los resultados del CSV

    // Leer el archivo CSV y procesarlo
    fs.createReadStream(filePath)
        .pipe(csv()) // Pasar el stream a través del parser CSV
        .on('data', (data) => results.push(data)) // Almacenar cada fila del CSV en el array de resultados
        .on('end', async () => { // Cuando se termina de leer el CSV
            let processedCount = 0; // Contador para personas procesadas
            let duplicateCount = 0; // Contador para identificaciones duplicadas
            let invalidEmails = 0; // Contador para correos inválidos
            let invalidRoles = 0; // Contador para roles inválidos
            let invalidFields = 0; // Contador para campos requeridos vacíos

            // Iterar sobre cada fila del CSV
            for (const row of results) {
                const { identificacion, nombre_usuario, apellido_usuario, rol, genero, email, contrasenna } = row; // Desestructurar los campos de la fila
                const missingFields = []; // Array para almacenar campos faltantes

                // Validar campos requeridos
                if (!identificacion) missingFields.push('identificacion'); // Comprobar si falta el nombre
                if (!nombre_usuario) missingFields.push('nombre_usuario'); // Comprobar si falta la identificación
                if (!apellido_usuario) missingFields.push('apellido_usuario'); // Comprobar si falta la contraseña
                if (!rol) missingFields.push('rol'); // Comprobar si falta el correo
                if (!genero) missingFields.push('genero'); // Comprobar si falta el rol
                if (!email) missingFields.push('email');
                if (!contrasenna) missingFields.push('contrasenna');

                if (missingFields.length > 0) { // Si hay campos faltantes
                    console.error(`Faltan campos requeridos en la fila: {\n  Identification: '${identificacion}', \n  Nombre: '${nombre_usuario}', \n Apellido: '${apellido_usuario}', \n Rol: '${rol}', \n Genero: '${genero}', \n  Email: '${email}', \n  Contraseña: '${contrasenna}'\n}`); // Log de error
                    console.log(`Campos faltantes:\n  ${missingFields.join('\n  ')}`); // Mostrar los campos faltantes
                    invalidFields++; // Incrementar el contador de campos vacíos
                    continue; // Saltar a la siguiente fila
                }

                try {
                    // Convertir el correo a minúsculas
                    const lowerCaseEmail = email.toLowerCase(); // Transformar el correo a minúsculas

                    // Verificar si la identificación ya existe
                    const idExists = await checkIfIdExists(identificacion); // Llamar a la función para verificar la existencia del ID

                    // Validar formato de correo
                    if (!isValidEmail(lowerCaseEmail)) { // Comprobar si el correo es válido
                        invalidEmails++; // Incrementar el conteo de correos inválidos
                        continue; // Saltar a la siguiente fila
                    }

                    // Validar rol
                    if (!isValidRole(rol)) { // Comprobar si el rol es válido
                        invalidRoles++; // Incrementar el conteo de roles inválidos
                        continue; // Saltar a la siguiente fila
                    }

                    // Si el identificador no existe, se procede a insertar
                    if (!idExists) { // Si el ID no existe en la base de datos
                        // Hashear la contraseña con bcrypt
                        const hashedPassword = await bcrypt.hash(contrasenna, 10); // Encriptar la contraseña

                        // Insertar la persona en la base de datos con correo en minúsculas
                        await insertPerson(identificacion, nombre_usuario, apellido_usuario, rol, genero, lowerCaseEmail,hashedPassword); // Llamar a la función para insertar
                        processedCount++; // Incrementar el conteo de personas procesadas
                    } else {
                        duplicateCount++; // Incrementar el conteo de duplicados
                    }
                } catch (error) {
                    console.error('Error al procesar el archivo CSV:', error); // Log de error en caso de excepción
                }
            }

            // Eliminar el archivo CSV después de procesarlo
            fs.unlink(filePath, (err) => { // Eliminar el archivo
                if (err) console.error('Error al eliminar el archivo:', err); // Log de error al eliminar
            });

            // Enviar respuesta al cliente con un alert
            res.send(` // Enviar respuesta al cliente
                <script>
                    alert('Archivo CSV procesado. ${processedCount} personas insertadas. ${duplicateCount} duplicadas no se procesaron. ${invalidEmails} con correo inválido. ${invalidRoles} con rol inválido. ${invalidFields} con campos requeridos vacíos.'); // Mostrar alerta con el resultado del procesamiento
                    window.location.href = '/'; // Redirigir al inicio
                </script>
            `);
        });
});

function isAuthenticated(req, res, next) {
    if (req.session && req.session.userId) {
        return next(); // El usuario está autenticado
    } else {
        res.redirect('/login'); // Redirigir a la página de login después de cerrar sesión
    }
}

app.get('/dashboard', isAuthenticated, (req, res) => {
    db.query('SELECT * FROM usuarios WHERE id = ?', [req.session.userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error en la consulta');
        }

        const loggedInUser = results[0]; // Este es el usuario autenticado
        db.query('SELECT * FROM usuarios', (err, allUsers) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error en la consulta');
            }
            // Renderiza el dashboard con la información del usuario autenticado y todos los usuarios
            res.render('dashboard', { user: loggedInUser, users: allUsers });
        });
    });
});

// Ruta para servir indexPeople.html
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'indexPeople.html'));
});

// Ruta para people.html
app.get('/manage-users', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'people.html'));
});

// Ruta para indexCsv.html
app.get('/upload', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'indexCsvv.html'));
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Error al cerrar sesión');
        }
        res.redirect('/login'); // Redirigir a la página de login después de cerrar sesión
    });
});
// Iniciar el servidor en el puerto definido
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`); // Log de inicio del servidor
});