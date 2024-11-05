// app.js

const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./db'); // Importar la conexión a la base de datos

// Inicializar la aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// Configurar el motor de vista y las vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configurar el middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'usta2024',
    resave: false,
    saveUninitialized: true,
}));

// Función de autenticación
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next(); // Usuario autenticado, continúa a la siguiente ruta
    }
    res.status(401).send('Acceso no autorizado'); // Usuario no autenticado
}

// Rutas
app.get('/', (req, res) => {
    res.redirect('/login'); // Redirigir a /login al acceder a la raíz
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM usuarios WHERE nombre_usuario = ?', [username], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error en la consulta');
        }
        if (results.length === 0) {
            return res.redirect('/login?error=Usuario o contraseña incorrectos'); // Redirigir con mensaje de error
        }

        const user = results[0];
        console.log('user:', user); // Esto te mostrará el objeto completo que viene de la base de datos
        console.log('user.password:', user.password); // Verifica si la contraseña está definida

        bcrypt.compare(password, user.contrasenna, (err, isMatch) => {
            if (err) throw err;
            if (!isMatch) {
                return res.redirect('/login?error=Usuario o contraseña incorrectos'); // Redirigir con mensaje de error
            }
            req.session.userId = user.id;
            req.session.role = user.role;
            return res.redirect('/dashboard'); // Redirigir al dashboard
        });
    });
});

// Ruta para el dashboard
app.get('/dashboard', isAuthenticated, (req, res) => {
    // Aquí asumimos que ya tienes el ID del usuario en la sesión
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

// Cerrar sesión
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Error al cerrar sesión');
        }
        res.redirect('/login'); // Redirigir a la página de login después de cerrar sesión
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


// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
