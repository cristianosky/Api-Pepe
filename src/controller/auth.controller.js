const express = require('express');
const app = express();

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
                    "Mensaje": "El correo ya se encuentra en uso"
                })
            } else {
                await connection.query (insert_query, (err, result)=> {
                    if (err) throw (err)

                    resp.send({
                        "status": true,
                        "datos": result.insertId
                    })
                })
            }
        })
    })
})

//Login
app.post("/ingresar", (req, res)=>{
    const correo = req.body.email
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
                            "token": token
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