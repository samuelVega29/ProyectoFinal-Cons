const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const app = express();
const path = require('path');
const port = 3000;
const connection = require("./db");

app.set('views', path.join(__dirname, 'views'));

// Configuración de archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Ruta para servir el archivo HTML principal
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/indexPeople.html'); // Servir el archivo HTML principal
});

app.use(bodyParser.json());


app.get('/usuarios', (req, res) => {
    connection.query('SELECT * FROM usuarios', (err, results) => {
        if (err) throw err; // Manejo de errores de consulta
        res.json(results); // Responder con los resultados en formato JSON
    });
});

// Ruta para agregar un nuevo usuario

app.post('/add', (req, res) => {
    console.log(req.body)
    // Desestructurar datos del cuerpo de la solicitud
    const { identificacion, nombre, apellido, rol, genero,email, password } = req.body;

    // Agregar logs para ver los valores recibidos
    console.log("Datos recibidos:");
    console.log("Identificación:", identificacion);
    console.log("Nombre de usuario:", nombre);
    console.log("Apellido de usuario:", apellido);
    console.log("Rol:", rol);
    console.log("Género:", genero);
    console.log("Email:", email);
    console.log("Contraseña:", password);

    // Verificar si el nombre de usuario ya existe
    connection.query('SELECT * FROM usuarios WHERE nombre_usuario = ?', [nombre], async (err, results) => {
        if (err) {
            console.error('Error al verificar el nombre de usuario:', err);
            return res.status(500).json({ message: 'Error en el servidor al verificar el nombre de usuario.' });
        }

        if (results.length > 0) {
            return res.status(400).json({ message: 'El nombre de usuario ya está en uso.' });
        }

        try {
            // Hashear la contraseña
            const hashedPassword = await bcrypt.hash(password, 10);

            // Agregar la nueva persona con la contraseña hasheada
            connection.query(
                'INSERT INTO usuarios (identificacion, nombre_usuario, apellido_usuario, rol, genero, email, contrasenna) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [identificacion, nombre, apellido, rol, genero, email, hashedPassword], // Usa hashedPassword en lugar de password
                (err, results) => {
                    if (err) {
                        console.error('Error al agregar la persona:', err);
                        return res.status(400).json({ message: 'Error al agregar la persona. Verifique los datos ingresados.' });
                    }
                    res.json({ message: '¡Persona agregada exitosamente!' }); // Confirmar que la persona fue agregada
                }
            );
        } catch (error) {
            console.error('Error al hashear la contraseña:', error);
            res.status(500).json({ message: 'Error en el servidor al hashear la contraseña.' });
        }
    });
});




app.put('/update/:id', async (req, res) => {
    const { id } = req.params;
    const { identificacion, nombre_usuario, apellido_usuario, rol, genero, email, password } = req.body;

    try {
        // Verificar si existe otro usuario con la misma identificación
        const [existingUser] = await connection.query(
            'SELECT * FROM usuarios WHERE identificacion = ? AND id != ?',
            [identificacion, id]
        );

        // Si existe un registro con esa identificación, enviar un error
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'La identificación ya está en uso por otra persona.' });
        }

        // Si hay una contraseña, encripta la nueva contraseña
        let hashedPassword = null;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        // Construir la consulta de actualización
        const updateQuery = `
            UPDATE usuarios 
            SET identificacion = ?, nombre_usuario = ?, apellido_usuario = ?, rol = ?, genero = ?, email = ?, contrasenna = ?
            WHERE id = ?`;

        const queryParams = [
            identificacion,
            nombre_usuario,
            apellido_usuario,
            rol,
            genero,
            email,
            hashedPassword || password, // Usar la contraseña encriptada o la misma si no se cambia
            id
        ];

        // Ejecutar la consulta de actualización
        await connection.query(updateQuery, queryParams);

        res.json({ message: 'Persona actualizada correctamente.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar la persona', error });
    }
});



// Ruta para eliminar una persona por ID
app.delete('/delete/:id', (req, res) => {
    const { id } = req.params; // Obtener el ID de la persona de los parámetros de la ruta
    connection.query('DELETE FROM usuarios WHERE id = ?', [id], (err, results) => {
        if (err) throw err; // Manejo de errores de consulta
        res.json({ message: 'Usuario eliminado' }); // Confirmar que la persona fue eliminada
    });
});

// Ruta para obtener una persona específica por ID
app.get('/usuario/:id', (req, res) => {
    const { id } = req.params; // Obtener el ID de la persona de los parámetros de la ruta
    connection.query('SELECT * FROM usuarios WHERE id = ?', [id], (err, results) => {
        if (err) throw err; // Manejo de errores de consulta
        res.json(results[0]); // Responder con la información de la persona
    });
});

// Ruta para buscar personas por nombre o identificación
app.get('/search', (req, res) => {
    const searchTerm = req.query.term; // Obtener el término de búsqueda de la consulta
    connection.query('SELECT * FROM usuarios WHERE nombre_usuario LIKE ? OR identificacion LIKE ?',
        [`%${searchTerm}%`, `%${searchTerm}%`], (err, results) => {
            if (err) throw err; // Manejo de errores de consulta
            res.json(results); // Responder con los resultados de búsqueda
        });
});



// Iniciar el servidor en el puerto especificado
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`); // Mensaje de confirmación al iniciar el servidor
});
