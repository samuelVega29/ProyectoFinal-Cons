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
    const { identificacion, password } = req.body;
    db.query('SELECT * FROM usuarios WHERE identificacion = ?', [identificacion], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error en la consulta');
        }
        if (results.length === 0) {
            return res.redirect('/login?error=Identificación o contraseña incorrectos');
        }

        const user = results[0];
        // Comparar contraseñas directamente (sin bcrypt)
        if (password !== user.password) {
            console.log("Contraseña incorrecta");
            return res.redirect('/login?error=Usuario o contraseña incorrectos');
        }

        req.session.userId = user.id;
        req.session.role = user.role;
        console.log("Inicio de sesión exitoso");
        return res.redirect('/managePeople/indexPeople.html');
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

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
