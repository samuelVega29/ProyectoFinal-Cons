const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const connection = require("./db");
const app = express();
const path = require('path');
const port = 3000;

// Establecer conexión a la base de datos
connection.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to MySQL');
});

app.set('views', path.join(__dirname, 'views'));

// Configuración de archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Ruta para servir el archivo HTML principal
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/indexPeople.html'); // Servir el archivo HTML principal
});

app.use(bodyParser.json());

// Ruta para obtener todos los registros de personas
app.get('/people', (req, res) => {
    connection.query('SELECT * FROM usuarios', (err, results) => {
        if (err) throw err; // Manejo de errores de consulta
        res.json(results); // Responder con los resultados en formato JSON
    });
});

// Ruta para agregar una nueva persona
app.post('/add', (req, res) => {
    const { identificacion, nombre, apellido, rol, genero, email, contrasenna} = req.body;
    
    connection.query('INSERT INTO usuarios (identificacion, nombre_usuario, apellido_usuario, rol, genero, email, contrasenna) VALUES (?, ?, ?, ?, ?, ?, ?)', 
        [identificacion, nombre, apellido, rol, genero, email, contrasenna], (err, results) => {
            if (err) {
                // Capturando error por código de proyecto duplicado
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ message: 'The project code must be unique.' });
                }
                return res.status(500).json({ message: 'Database error.' });
            }
            res.json({ message: 'Person added successfully!' });
        });
});

// Ruta para actualizar la información de una persona existente
app.put('/update/:id', (req, res) => {
    const { id } = req.params; // Obtener el ID de la persona de los parámetros de la ruta
    const {  identificacion, nombre, apellido, rol, genero, email, contrasenna } = req.body; // Obtener los nuevos datos del cuerpo de la solicitud

    // Verificar si la nueva identificacion ya existe en la base de datos
    connection.query('SELECT * FROM usuarios WHERE identificacion = ? AND id != ?', [identificacion, id], (err, results) => {
        if (err) throw err; // Manejo de errores de consulta

        // Si existe un registro con esa identificacion, enviar un error
        if (results.length > 0) {
            return res.status(400).json({ message: 'La identificación ya está en uso por otra persona.' });
        }

        // Si no existe, proceder a actualizar
        connection.query('UPDATE usuarios SET identificacion = ?, nombre_usuario = ?, apellido_usuario = ?, rol = ?, genero = ?, email = ?, contrasenna = ? WHERE id = ?', 
            [identificacion, nombre, apellido, rol, genero, email, contrasenna, id], (err, results) => {
                if (err) throw err; // Manejo de errores de consulta
                res.json({ message: 'Persona actualizada correctamente.' }); // Confirmar que la persona fue actualizada
            });
    });
});


// Ruta para eliminar una persona por ID
app.delete('/delete/:id', (req, res) => {
    const { id } = req.params; // Obtener el ID de la persona de los parámetros de la ruta
    connection.query('DELETE FROM usuarios WHERE id = ?', [id], (err, results) => {
        if (err) throw err; // Manejo de errores de consulta
        res.json({ message: 'Person deleted successfully!' }); // Confirmar que la persona fue eliminada
    });
});

// Ruta para obtener una persona específica por ID
app.get('/person/:id', (req, res) => {
    const { id } = req.params; // Obtener el ID de la persona de los parámetros de la ruta
    connection.query('SELECT * FROM usuarios WHERE id = ?', [id], (err, results) => {
        if (err) throw err; // Manejo de errores de consulta
        res.json(results[0]); // Responder con la información de la persona
    });
});

// Ruta para buscar personas por nombre o identificación
app.get('/search', (req, res) => {
    const searchTerm = req.query.term; // Obtener el término de búsqueda de la consulta
    connection.query('SELECT * FROM usuarios WHERE identificacion LIKE ?', 
        [`%${searchTerm}%`], (err, results) => {
            if (err) throw err; // Manejo de errores de consulta
            res.json(results); // Responder con los resultados de búsqueda
        });
});

// Ruta para servir indexPeople.html
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'indexPeople.html'));
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

// Iniciar el servidor en el puerto especificado
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`); // Mensaje de confirmación al iniciar el servidor
});
