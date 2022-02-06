const jwt = require('jsonwebtoken')

function verificarJWT(req, res, next){
    const token = req.headers["authorization"];
    if(token){
        jwt.verify(token, process.env.ACCESO_TOKEN_SECRETO,(err, result)=>{
            if(err){
                res.send({
                    "status": false,
                    "mensaje": "Token invalido"
                })
            }else{
                console.log(result);
                next
            }
        })
    }else{
        res.send({
            "status": false,
            "mensaje": "Token no proporcionado"
        })
    }
}

exports.verificarJWT = verificarJWT