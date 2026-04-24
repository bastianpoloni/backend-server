var express = require('express');
var mysql = require('mysql');
var app = express();
var cors = require('cors');
var fileUpload = require('express-fileupload');
app.use(fileUpload());   


const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
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