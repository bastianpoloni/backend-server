var express = require('express');
var mysql = require('mysql');
var app = express();
var cors = require('cors');
var fileUpload = require('express-fileupload');
var jwt= require('jsonwebtoken');

let SEED= "este-es-un-seed-dificil";

app.use(fileUpload());   

var bcrypt = require('bcrypt');


const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.use(function(req,res,next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-client-key, x-client-token, x-client-secret, Authorization");
    next();
});

app.use(function(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({
            message: 'Token no proporcionado'
        });
    }
    
    jwt.verify(token, SEED, (err, user) => {
        if (err) {
            return res.status(403).json({
                message: 'Token inválido'
            });
        }
        req.user = user;
        next();
    });
});

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root123',
    database: 'acme'
});

connection.connect();

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});

app.get('/', function (req, res) {
    res.status(200).json({
        ok: true,
        message: 'Todo funciona correctamente'
    })
}); 

app.get('/productos', function (req, res) {
    const sql = 'SELECT * FROM productos';
    connection.query(sql, function (error, results) {
        if (error) {
            res.status(500).json({
                ok: false,
                message: 'Error al obtener los productos'
            });
        } else {
            res.status(200).json({
                ok: true,
                productos: results
            });
        }
    });
});

app.post('/productos', function (req, res) {
    const {name, code, date ,price, description, rate, image} = req.body;
    const sql = 'INSERT INTO productos (productName, productCode, releaseDate, price, description, starRating, imageURL) VALUES (?, ?, ?, ?, ?, ?, ?)';
    connection.query(sql, [name, code, date ,price, description, rate, image], function (error, results) {
        if (error) {
            res.status(500).json({
                message: 'Error al crear el producto'
            });
        } else {
            res.status(201).json({
                ok: true,
                message: 'Producto creado correctamente',
                productoId: results.insertId
            });
        }
    });
});

app.get('/productos/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'SELECT * FROM productos WHERE productId = ?';
    connection.query(sql, [id], function (error, results) {
        if (error) {
            res.status(500).json({
                message: 'Error al obtener el producto'
            });
        } else {
            res.status(200).json({
                producto: results[0]
            });
        }
    });
});

app.put('/upload/productos/:id', (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({
            message: 'No se ha seleccionado ningún archivo'
        });
    }
    const file = req.files.image;
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];

    if (!allowedExtensions.includes(fileExtension)) {
        return res.status(400).json({
            message: 'Archivo no permitido. Solo se permiten imágenes (jpg, jpeg, png, gif)'
        });
    }
    
    const productId = req.params.id;
    const fileName = `${productId}-${new Date().getMilliseconds()}.${fileExtension}`;
    const uploadPath = __dirname + '/upload/productos/' + fileName;
    
    
    console.log(uploadPath);

    file.mv(uploadPath, (err) => {
        if (err) {
            return res.status(500).json({
                message: 'Error al subir el archivo'
            });
        }
        const sql = 'UPDATE productos SET imageURL = ? WHERE productId = ?';
        connection.query(sql, [uploadPath, productId], (error, results) => {
            if (error) {
                res.status(500).json({
                    message: 'Error al actualizar el producto'
                });
            } else {
                res.status(200).json({
                    message: 'Producto actualizado correctamente'
                });
            }
        });
    });
});

app.delete('/productos/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'DELETE FROM productos WHERE productId = ?';
    connection.query(sql, [id], function (error, results) {
        if (error) {
            res.status(500).json({
                message: 'Error al eliminar el producto'
            });
        } else {
            res.status(200).json({
                message: 'Producto eliminado correctamente'
            });
        }
    });
});

app.put('/productos/:id', (req, res) => {
    const id = req.params.id;
    const {name, code, date ,price, description, rate} = req.body;
    const sql = 'UPDATE productos SET productName = ?, productCode = ?, releaseDate = ?, price = ?, description = ?, starRating = ? WHERE productId = ?';
    connection.query(sql, [name, code, date ,price, description, rate, id], (error, results) => {
        if (error) {
            res.status(500).json({
                message: 'Error al actualizar el producto'
            });
        } else {
            res.status(200).json({
                message: 'Producto actualizado correctamente'
            });
        }
    });
});

app.get('/existeproducto/:code', (req, res) => {
    const sql = 'SELECT * FROM productos WHERE productCode = ?';
    connection.query(sql, [req.params.code], (error, results) => {
        if (error) throw error;
        res.status(200).json({
            ok: true,
            data: results[0],
            existe: results.length > 0
        });
    });
});  

app.post('/usuarios', (req, res) => {
    const { name, email, img, role, password } = req.body;
    let hashedPassword = bcrypt.hashSync(password, 10);

    const sql = `INSERT INTO usuarios (userName, userEmail, userPassword, userImg, userRole) VALUES (?, ?, ?, ?, ?)`;
    connection.query(sql, [name, email, hashedPassword, img, role], (err, results) => {
        if (err) throw err;
        res.status(201).json({
            ok: true,
            message: 'Usuario creado correctamente'
        });
    });
});

app.post('/login', (req, res) => {
    const {email} = req.body;
    let hashedPassword = bcrypt.hashSync(req.body.password, 10);

    const sql = `SELECT * FROM usuarios WHERE userEmail = ?`;
    connection.query(sql, [email], (err, results) => {
        if (err) throw err;
        if (results.length === 0) {
            return res.status(404).json({
                ok: false,
                message: 'Usuario no encontrado'
            });
        }
        const user = results[0];
        const passwordMatch = bcrypt.compareSync(req.body.password, user.userPassword);
        if (!passwordMatch) {
            return res.status(401).json({
                ok: false,
                message: 'Contraseña incorrecta'
            });
        }
        const token = jwt.sign({ usuario: user }, SEED, { expiresIn: 14400 });
        res.status(200).json({
            ok: true,
            message: 'Login exitoso',
            usuario: user,
            token: token
        });
    });
});