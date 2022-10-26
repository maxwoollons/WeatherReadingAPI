//define api key based authentication middleware 
//this funtion makes use of higher order funtion
import { ObjectID } from "bson"
import {db} from "./database.js"


export default function auth(allowed_roles) {
    return function (req, res, next) {
        const api_key = req.body.api_key
        if (api_key){
            if(ObjectID.isValid(api_key)){
                const access = db.collection("access")
                access.findOne({_id: new ObjectID(api_key)})
                .then(access_document => {
                    console.log(allowed_roles)
                    if(access_document){
                        if(allowed_roles.includes(access_document.accesslevel)){
                            next()
                        }else{
                            res.status(403).json({error: "Forbidden"})
                        }
                    }else{
                        res.status(403).json({error: "Forbidden"})
                    }
                }).catch(error => {
                    res.status(500).json({error: "Server error"})
                }
                )

            
        } else{
            res.status(400).json({error: "Invalid API Key"})
        }
    } else {
        res.status(403).json({error: "Forbidden"})
    }
}
}
