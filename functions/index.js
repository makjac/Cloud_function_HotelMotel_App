const functions = require("firebase-functions");

const admin = require("firebase-admin");

var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://hotelmotel-66527-default-rtdb.europe-west1.firebasedatabase.app"
});


const express = require("express");
const cors = require("cors");

//main
const app = express();
app.use(cors({origin : true}));

//Routers
app.get("/", (req, res) => {
    return res.status(200).send("Hello world!, Hotel Motel here!");
});

//export the api to firebase cloud function
exports.app = functions.https.onRequest(app);

