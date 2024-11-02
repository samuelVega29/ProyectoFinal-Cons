// Importar las dependencias necesarias
const express = require('express'); // Framework para crear el servidor web
const multer = require('multer'); // Middleware para manejar la subida de archivos
const csv = require('csv-parser'); // Módulo para analizar archivos CSV
const fs = require('fs'); // Módulo para manipulación de archivos del sistema
const mysql = require('mysql2'); // Cliente para conectarse a MySQL
const bcrypt = require('bcrypt'); // Módulo para encriptar contraseñas
const path = require('path'); // Módulo para manejar rutas de archivos

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

const upload = multer({ storage: storage }); // Inicializar multer con la configuración de almacenamiento

// Servir archivos estáticos (HTML, CSS) desde la carpeta 'public'
app.use(express.static('public'));

// Función para verificar si el número de identificación ya existe en la base de datos
const checkIfIdExists = (identification) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM people WHERE identification = ?'; // Consulta SQL para buscar la identificación
        connection.query(query, [identification], (err, results) => {
            if (err) return reject(err); // Rechazar la promesa si hay un error
            resolve(results.length > 0); // Retornar true si hay resultados (la identificación existe)
        });
    });
};

// Función para insertar una persona en la base de datos
const insertPerson = (name, identification, hashedPassword, email, role) => {
    return new Promise((resolve, reject) => {
        const query = 'INSERT INTO people (name, identification, password, email, role) VALUES (?, ?, ?, ?, ?)'; // Consulta SQL para insertar una persona
        connection.query(query, [name, identification, hashedPassword, email.toLowerCase(), role], (err) => {
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
const isValidRole = (role) => {
    return role === 'admin' || role === 'user_regular'; // Retorna true si el rol es válido
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
                const { name, identification, password, email, role } = row; // Desestructurar los campos de la fila
                const missingFields = []; // Array para almacenar campos faltantes

                // Validar campos requeridos
                if (!name) missingFields.push('name'); // Comprobar si falta el nombre
                if (!identification) missingFields.push('identification'); // Comprobar si falta la identificación
                if (!password) missingFields.push('password'); // Comprobar si falta la contraseña
                if (!email) missingFields.push('email'); // Comprobar si falta el correo
                if (!role) missingFields.push('role'); // Comprobar si falta el rol

                if (missingFields.length > 0) { // Si hay campos faltantes
                    console.error(`Faltan campos requeridos en la fila: {\n  name: '${name}',\n  identification: '${identification}',\n  password: '${password}',\n  email: '${email}'\n}`); // Log de error
                    console.log(`Campos faltantes:\n  ${missingFields.join('\n  ')}`); // Mostrar los campos faltantes
                    invalidFields++; // Incrementar el contador de campos vacíos
                    continue; // Saltar a la siguiente fila
                }

                try {
                    // Convertir el correo a minúsculas
                    const lowerCaseEmail = email.toLowerCase(); // Transformar el correo a minúsculas

                    // Verificar si la identificación ya existe
                    const idExists = await checkIfIdExists(identification); // Llamar a la función para verificar la existencia del ID

                    // Validar formato de correo
                    if (!isValidEmail(lowerCaseEmail)) { // Comprobar si el correo es válido
                        invalidEmails++; // Incrementar el conteo de correos inválidos
                        continue; // Saltar a la siguiente fila
                    }

                    // Validar rol
                    if (!isValidRole(role)) { // Comprobar si el rol es válido
                        invalidRoles++; // Incrementar el conteo de roles inválidos
                        continue; // Saltar a la siguiente fila
                    }

                    // Si el identificador no existe, se procede a insertar
                    if (!idExists) { // Si el ID no existe en la base de datos
                        // Hashear la contraseña con bcrypt
                        const hashedPassword = await bcrypt.hash(password, 10); // Encriptar la contraseña

                        // Insertar la persona en la base de datos con correo en minúsculas
                        await insertPerson(name, identification, hashedPassword, lowerCaseEmail, role); // Llamar a la función para insertar
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

// Iniciar el servidor en el puerto definido
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`); // Log de inicio del servidor
});
