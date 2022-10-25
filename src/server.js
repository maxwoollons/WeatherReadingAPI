import express from "express"
import { db } from "./database.js"
import { MongoClient, ObjectId } from "mongodb"
import auth from "./auth.js"
import cors from "cors"

const port = 8080
const app = express()


app.use(cors())

app.use(express.json())



app.post("/add_reading", (req, res) => {
    const {
        Time: time = (new Date()).toISOString(),
        "Device ID": device_id = undefined,
        "Device Name": device_name = undefined,
        Latittude: latittude = undefined,
        Longitude: longitude = undefined,
        "TemperatureC": temperature = undefined,
        "Atmospheric Pressure (kPa)": atmospheric_pressure = undefined,
        "Lightning Average Distance (km)": lightning_average_distance = undefined,
        "Lightning Strike Count": lightning_strike_count = undefined,
        "Maximum Wind Speed (m/s)": maximum_wind_speed = undefined,
        "Precipitation mm/h": precipitation = undefined,
        "Solar Radiation (W/m2)": solar_radiation = undefined,
        "Vapor Pressure (kPa)": vapor_pressure = undefined,
        "Humidity (%)": humidity = undefined,
        "Wind DirectionDeg": wind_direction = undefined,
        "Wind Speed (m/s)": wind_speed = undefined,
        "temperatureF" : temperatureF = undefined

    } = req.body;

    console.log(req.body)




    const reading_documents = {};

    if (device_id) reading_documents["Device ID"] = device_id;
    if (device_name) reading_documents["Device Name"] = device_name;
    if (latittude) reading_documents["Latittude"] = latittude;
    if (longitude) reading_documents["Longitude"] = longitude;
    if (temperature) reading_documents["TemperatureC"] = temperature;

    if (atmospheric_pressure) reading_documents["Atmospheric Pressure (kPa)"] = atmospheric_pressure;
    if (lightning_average_distance) reading_documents["Lightning Average Distance (km)"] = lightning_average_distance;
    if (lightning_strike_count) reading_documents["Lightning Strike Count"] = lightning_strike_count;
    if (maximum_wind_speed) reading_documents["Maximum Wind Speed (m/s)"] = maximum_wind_speed;

    if (precipitation) reading_documents["Precipitation mm/h"] = precipitation;

    if (solar_radiation) reading_documents["Solar Radiation (W/m2)"] = solar_radiation;
    if (vapor_pressure) reading_documents["Vapor Pressure (kPa)"] = vapor_pressure;

    if (humidity) reading_documents["Humidity (%)"] = humidity;
    if (wind_direction) reading_documents["Wind DirectionDeg"] = wind_direction;

    if (wind_speed) reading_documents["Wind Speed (m/s)"] = wind_speed;

    if (time) reading_documents["Time"] = time;
    if(temperatureF) reading_documents["TemperatureF"] = temperatureF; 

    console.log(reading_documents)



    db.collection("readings").insertOne(reading_documents, err => {
        if (err) {
            console.log(err)
            res.status(500).send(err)
        } else {
            res.status(200).send("OK")
        }
    })
})





app.get("/get_reading", (req, res) => {
    const { api_key } = req.query
    if (api_key) {

        if (api_key.length != 24) {
            res.status(400).json("Invalid API Key")
        }
        else {
            var o_id = new ObjectId(api_key);
            db.collection("access").findOne({ _id: o_id }, (err, doc) => {
                if (err) {
                    res.status(500).json({ message: "error" })
                } else {
                    if (doc) {
                        db.collection("readings").findOne({}).then((err, docs) => {
                            if (err) {
                                res.status(200).json(err)
                            } else {
                                res.status(500).json({ message: "error" })
                            }
                        }
                        )
                    } else {
                        res.status(401).send("Invalid API Key")
                    }
                }
            }
            )
        }
    } else {
        res.status(400).json("Invalid API Key")
    }

}
)



app.post("/access/request_key", (req, res) => {
    const access_created_date = new Date()
    const accesslevel = "user"
    db.collection("access").insertOne({ access_created_date, accesslevel }).then(result => {
        res.json(result.insertedId)
    }).catch(error => {
        console.log(error)
        res.json({ error: error })
    }
    )
}
)

//weather max percipitation last 5 years
app.get("/reading/max_precipitation", (req, res) => {
    const years = req.query.years
    const api_key = req.query.api_key
    let time = new Date()
    //time minus 5 years
    time.setFullYear(time.getFullYear() - years)


    if (api_key) {

        if (api_key.length != 24) {
            res.status(400).json("Invalid API Key")
        }
        else {
            var o_id = new ObjectId(api_key);
            db.collection("access").findOne({ _id: o_id }, (err, doc) => {
                if (err) {
                    res.status(500).json({ message: "error" })
                } else {
                    if (doc) {
                        //within the last 5 years 
                        db.collection("readings").find({ Time: { $gt: time.toISOString() } }).sort({ "Precipitation mm/h": -1 }).limit(1).toArray().then((err, docs) => {
                            if (err) {
                                res.status(200).json(err)
                            } else {
                                res.status(500).json({ message: "error" })
                            }
                        }
                        )
                    } else {
                        res.status(401).send("Invalid API Key")
                    }
                }
            }
            )
        }
    } else {
        res.status(400).json("Invalid API Key")
    }
}
)








//ADMINISTARTION OPERATIONS

//delete specific api key from access if admin user api key
app.delete("/access/delete_key", (req, res) => {
    let api_key = req.body.api_key
    let id = req.body.id
    console.log(req.body.api_key)

    if (api_key) {

        if (api_key.length != 24) {
            res.status(400).json("Invalid API Key")

        }
        else {

            var o_id = new ObjectId(api_key);
            db.collection("access").findOne({ _id: o_id }, (err, doc) => {
                if (err) {
                    res.status(500).json({ message: "error" })
                } else {
                    if (doc) {
                        if (doc.accesslevel == "admin") {
                            id = new ObjectId(id)
                            db.collection("access").deleteOne({ _id: id }, (err, doc) => {
                                if (err) {
                                    res.status(500).json({ message: "error" })
                                } else {
                                    res.status(200).json({ message: "ok" })
                                }
                            }
                            )
                        } else {
                            res.status(401).send("Invalid API Key")
                        }
                    } else {
                        res.status(401).send("Invalid API Key")
                    }
                }
            }
            )
        }
    } else {
        res.status(400).json("Invalid API Key")
    }
}
)

app.delete("/access/delete_keys", auth("admin"), (req, res) => {
    console.log("admin user")
    let api_keys = req.body.id
    console.log(api_keys)
    if (api_keys) {
        for (let i = 0; i < api_keys.length; i++) {
            let id = new ObjectId(api_keys[i])
            db.collection("access").deleteOne({ _id: id }, (err, doc) => {
                if (err) {
                    res.status(500).json({ message: "error" })
                } else {
                    console.log("Succesfully Deleted " + api_keys[i])
                }

            }
            )
        }
    } else {
        res.status(400).json("Invalid API Key")
    }


    res.status(200).json({ message: "ok" })

})


app.patch("/access/make_admin", auth("admin"), (req, res) => {
    let api_key = req.body.api_key
    let id = req.body.id
    if (id) {
        for (let i = 0; i < id.length; i++) {
            let idd = new ObjectId(id[i])
            db.collection("access").updateOne({ _id: idd }, { $set: { accesslevel: "admin" } }, (err, doc) => {
                if (err) {
                    res.status(500).json({ message: "error" })
                }
            }
            )
        }
        res.json({ message: `Users ${id} made admin` })

    } else {
        res.send("Invalid API Key")
    }

})


//update longitude and latitude by longitude and latitude
app.put("/reading/update_long_lat", auth("admin"), (req, res) => {
    let longitude = req.body.longitude
    let latitude = req.body.latitude
    let new_longitude = req.body.new_longitude
    let new_latitude = req.body.new_latitude
    if (longitude && latitude && new_longitude && new_latitude) {
        db.collection("readings").updateMany({ Longitude: longitude, Latitude: latitude }, { $set: { Longitude: new_longitude, Latitude: new_latitude } }, (err, doc) => {
            if (err) {
                res.status(500).json({ message: "error" })
            } else {
                res.status(200).json({ message: "ok" })
            }
        }
        )
    } else {
        res.status(400).json("Invalid API Key")
    }
}
)


// //get reading by lattitude and longitude by day
// app.get("/reading/long_lat_day", auth("user"), (req, res) => {
//     let longitude = req.query.longitude
//     let latitude = req.query.latitude
//     let day = req.query.day
//     let month = req.query.month
//     let year = req.query.year
//     let time = new Date(year, month, day)
//     if (longitude && latitude && day && month && year) {
//         db.collection("readings").findOne({ Longitude: longitude, Latitude: latitude, Time: { $gt: time.toISOString() } }, (err, doc) => {
//             if (err) {
//                 res.status(500).json({ message: "error" })
//             } else {
//                 res.status(200).json(doc)
//             }
//         }
//         )
//     } else {
//         res.status(400).json("Invalid API Key")
//     }
// }
// )




app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})