const jwt = require("jsonwebtoken")
const dotenv = require('dotenv')
dotenv.config();
function generateAccessToken (user) {
    return  jwt.sign(user, process.env.ACCESO_TOKEN_SECRETO)
}

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
                next();
            }
        })
    }else{
        res.send({
            "status": false,
            "mensaje": "Token no proporcionado"
        })
    }
}

exports.generateAccessToken=generateAccessToken
exports.verificarJWT= verificarJWT