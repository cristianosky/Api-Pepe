const express = require('express');
const app = express();
const mysql = require('mysql')
const bcrypt = require("bcrypt");
const body = require("body-parser")
const {generateAccessToken, verificarJWT} = require("./token")
const dotenv = require('dotenv');
const multer = require('multer');
const cord = require('cors')
const multipar = require('connect-multiparty')

const multiPartMiddleware = multipar({
    uploadDir: 'src/subidas'
})
 

// let upload = multer({storage: storage});
app.use(body.urlencoded({ extended: true }));
app.use(body.json());
app.use(cord())
dotenv.config()
app.listen(process.env.PORT);


const db = mysql.createPool({
    host: process.env.DB_HOST,       //This is your localhost IP
    user: process.env.DB_USER,         // "newuser" created in Step 1(e)
    password: process.env.DB_PASSWORD,  // password for the new user
    database: process.env.DB_DATABASE,      // Database name
    port: process.env.DB_PORT
})

app.use(function (req, res, next) {

    res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
	res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
	res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
	next();

});

db.getConnection((err, connection)=>{
    if(err) throw (err);
    console.log("Conexion exitosa: "+connection.threadId);
});
console.log('Server iniciado');


//Auth 

//Crear Usuario
app.post("/crearusurio", async (req, resp)=>{
    const nombre = req.body.name;
    const correo = req.body.email;
    const hashedPassword = await bcrypt.hash(req.body.password,10);
    db.getConnection( async (err, connection) => {
        if (err) throw (err)
        const sqlSearch = "SELECT * FROM usuariosPepe WHERE correo = ?"
        const search_query = mysql.format(sqlSearch,[correo]);

        const sqlInsert = "INSERT INTO usuariosPepe (`id`, `nombre`, `correo`, `password`, `rol`) VALUES (null,?,?,?,2)"
        const insert_query = mysql.format(sqlInsert,[nombre, correo, hashedPassword]);
        await connection.query (search_query, async (err, result) => {
            if (err) throw (err);
            if (result.length != 0) {
                return resp.send({
                    "status": false,
                    "mensaje": "El correo ya se encuentra en uso"
                })
            } else {
                await connection.query (insert_query, (err, result)=> {
                    if (err) throw (err)
                    const body = {
                        id: result.insertId,
                        name: nombre,
                        rol: 2
                    }

                    const token = generateAccessToken(body)
                    resp.send({
                        "status": true,
                        "datos": {
                            "token": token,
                            "perfil": {
                                "id": result.insertId,
                                "name": nombre,
                                "rol": 2
                            }
                        }
                    })
                })
            }
        })
    })
})

//Login
app.post("/ingresar", (req, res)=>{
    const correo = req.body.correo
    const password  = req.body.password

    db.getConnection(async (err, connection)=>{
        if (err) throw (err)
        const sqlSearch = "Select * from usuariosPepe where correo = ?"
        const search_query = mysql.format(sqlSearch,[correo]);
        await connection.query (search_query, async (err, result) => {
            if (err) throw (err)
            if (result.length == 0) {
                res.send({
                    "status": false,
                    "mensaje": "El correo no existe"
                })
            } else {
                const hashedPassword = result[0].password
                if (await bcrypt.compare(password, hashedPassword)) {
                    const json = {
                        id: result[0].id,
                        name: result[0].nombre,
                        rol: result[0].rol
                    }
                    const token = generateAccessToken(json)
                    res.send({
                        "status": true,
                        "datos": {
                            "token": token,
                            "perfil": {
                                "id": result[0].id,
                                "name": result[0].nombre,
                                "rol": result[0].rol 
                            }
                        }
                    })
                }else{
                    res.send({
                        "status": false,
                        "mensaje": "Contraseña incorrecta"
                    })
                }
            }
        })
    })
})

//Fin auth 


//Prudoctos
//Obtener todos los producots
app.get("/getproductos", verificarJWT, (req, res)=>{
    db.getConnection(async (err, connection)=>{
        if (err) throw (err)
        const sqlSearch = "Select * from productos"
        const search_query = mysql.format(sqlSearch)
        await connection.query (search_query, async (err, result) => {
            if (err) throw (err)
            res.send({
                "status": true,
                "datos": result
            })
        })
    })
})

//Obtener un solo producto
app.get("/getproducto", verificarJWT, (req, res)=>{
    const busqueda = req.query.id
    db.getConnection(async (err, connection)=>{
        if (err) throw (err)
        const sqlSearch = "Select * from productos where id = ?"
        const search_query = mysql.format(sqlSearch, [busqueda])
        await connection.query (search_query, async (err, result) => {
            if (err) throw (err)
            res.send({
                "status": true,
                "datos": result
            })
        })
    })
})

//Obtener productos por categorias
app.get("/getproductocat", verificarJWT, (req, res)=>{
    const busqueda = req.query.categoria
    db.getConnection(async (err, connection)=>{
        if (err) throw (err)
        const sqlSearch = "Select * from productos where categoria = ?"
        const search_query = mysql.format(sqlSearch, [busqueda])
        await connection.query (search_query, async (err, result) => {
            if (err) throw (err)
            res.send({
                "status": true,
                "datos": result
            })
        })
    })
})

//Eliminar
app.get("/eliminarproducto", verificarJWT, (req, res)=>{
    const busqueda = req.query.id
    db.getConnection(async (err, connection)=>{
        if (err) throw (err)
        const sqlSearch = "delete from productos where id = ?"
        const search_query = mysql.format(sqlSearch, [busqueda])
        await connection.query (search_query, async (err, result) => {
            if (err) throw (err)
            res.send({
                "status": true,
                "mensaje": "Eliminado satisfactoriamente"
            })
        })
    })
})

//Agregar
app.post("/agregarproductos",verificarJWT, async(req, res)=>{
    const nombre = req.body.name;
    const descripcion = req.body.descripcion;
    const imagen = req.body.imagen;
    const precio = req.body.precio
    const categoria = req.body.categoria
    db.getConnection(async (err, connection)=>{
        if(err) throw (err);
        const sqlSearch = "INSERT INTO productos (`id`, `nombre`, `descripcion`, `imagen`, `precio`, `categoria`) VALUES (null,?,?,?,?,?)"
        
        const insert_query = mysql.format(sqlSearch,[nombre, descripcion, imagen, precio, categoria]);
        await connection.query(insert_query, (err, result)=>{
            if(err) throw (err);
            res.send({
                "status": true,
                "mensaje": "Datos guardado correctamente"
            })
        })
    })
})

//Editar
app.post("/editarproductos",verificarJWT, async(req, res)=>{
    const nombre = req.body.name;
    const descripcion = req.body.descripcion;
    const imagen = req.body.imagen;
    const precio = req.body.precio
    const categoria = req.body.categoria
    const id = req.body.id
    db.getConnection(async (err, connection)=>{
        if(err) throw (err);
        const sqlSearch = "UPDATE productos SET nombre = ?, descripcion = ?, imagen = ?, precio = ?, categoria = ? WHERE id = ?"
        
        const insert_query = mysql.format(sqlSearch,[nombre, descripcion, imagen, precio, categoria ,id]);
        await connection.query(insert_query, (err, result)=>{
            if(err) throw (err);
            res.send({
                "status": true,
                "mensaje": "Datos editado correctamente"
            })
        })
    })
})

//Fin productos

// Categoria
//Obterner todas las categorias
app.get("/getcategorias", verificarJWT, (req, res)=>{
    db.getConnection(async (err, connection)=>{
        if (err) throw (err)
        const sqlSearch = "Select * from categoria"
        const search_query = mysql.format(sqlSearch)
        await connection.query (search_query, async (err, result) => {
            if (err) throw (err)
            res.send({
                "status": true,
                "datos": result
            })
        })
    })
})

//agregar
app.post("/agregarcategoria",verificarJWT, async(req, res)=>{
    const nombre = req.body.name;
    db.getConnection(async (err, connection)=>{
        if(err) throw (err);
        const sqlSearch = "INSERT INTO categoria (`id`, `nombre`) VALUES (null,?)"
        
        const insert_query = mysql.format(sqlSearch,[nombre]);
        await connection.query(insert_query, (err, result)=>{
            if(err) throw (err);
            res.send({
                "status": true,
                "mensaje": "Datos guardado correctamente"
            })
        })
    })
})

//editar
app.post("/editarcategoria",verificarJWT, async(req, res)=>{
    const nombre = req.body.name;
    const id = req.body.id
    db.getConnection(async (err, connection)=>{
        if(err) throw (err);
        const sqlSearch = "UPDATE productos SET nombre = ? where id = ?"
        
        const insert_query = mysql.format(sqlSearch,[nombre, id]);
        await connection.query(insert_query, (err, result)=>{
            if(err) throw (err);
            res.send({
                "status": true,
                "mensaje": "Datos actualizados correctamente"
            })
        })
    })
})

//Eliminar
app.get("/eliminarproducto", verificarJWT, (req, res)=>{
    const busqueda = req.query.id
    db.getConnection(async (err, connection)=>{
        if (err) throw (err)
        const sqlSearch = "delete from categoria where id = ?"
        const search_query = mysql.format(sqlSearch, [busqueda])
        await connection.query (search_query, async (err, result) => {
            if (err) throw (err)
            res.send({
                "status": true,
                "mensaje": "Eliminado satisfactoriamente"
            })
        })
    })
})

//fin Categoria

//verificar
app.get("/verifi", verificarJWT, (req, res)=>{
    res.send({
        "status": true,
        "mensaje": "Token valido"
    })
})


///

app.post('/upload', multiPartMiddleware, function (req, res) {
    console.log(req)
    return
    if (!req.file) {
        console.log("No file received");
        return res.send({
          success: false
        });
    
      } else {
        console.log('file received');
        return res.send({
          success: true
        })
      }
});