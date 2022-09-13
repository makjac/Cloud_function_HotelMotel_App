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
app.use(express.json());

//main database reference
const firestore = admin.firestore();


//Routers
app.get("/", (req, res) => {
    return res.status(200).send("Hello world!, Hotel Motel here!");
});

//get -> get()

app.get("/api/holet/get_all_from_location/:location", (req, res) => {
  (async () => {
    try{
      const hotelRef = firestore.collection("hotel");
      const snapshot = await hotelRef.where('city', '==', req.params.location).get();

      const response = snapshot.docs.map(doc => {
        return { id: doc.id, ...doc.data() };
      });

      return res.status(200).send({status:"200", msg: "sucess", data: {results: snapshot.docs.length, ...response}});
    } catch(error) {
      console.log(error);
      return res.status(500).send({status:"500", msg: error});
    }
  })();
});

app.get("/api/hotel/search_with_criteria/:location/:room", (req, res) => {
  (async () => {
    try{
      const hotelRef = firestore.collection("hotel");
      const bookingRef = firestore.collection("booking");
      const hotelLocation = hotelRef.where('city', '==', req.params.location).select('name', 'rating');

      const snapshot =  await hotelLocation.get();

      var response;

      await Promise.all(
        response = snapshot.docs.map(async (hotel) => {
          const roomSnapshot = await hotelRef.doc(hotel.id).collection("room").select('price', 'facilities').get();
          return roomSnapshot.docs.map(async (room) => {
            const bookingSnapshot = await bookingRef.where('room_id', '==', room.id).get();
            return bookingSnapshot.docs.map(async (booking) => {
              return {hotel_id: hotel.id, ...hotel.data(), ...room.data()};
            });
          });
        })
      );

      return res.status(200).send({status:"200", msg: "sucess", data: {results: response.length, ...response}});
    } catch(error) {
      console.log(error);
      return res.status(500).send({status:"500", msg: "error"});
    }
  })();
});

app.get("/api/hotel/get_hotel_rooms/:hotel_id", (req, res) => {
  (async () => {
    try{
      const roomRef = firestore.collection("hotel").doc(req.params.hotel_id).collection("room");
      const snapshot = await roomRef.get();

      const response = snapshot.docs.map(room => {
        return { id: room.id, ...room.data() };
      });

      return res.status(200).send({status:"200", msg: "sucess", data: {results: response.length, ...response}});
    } catch(error) {
      console.log(error);
      return res.status(500).send({status:"500", msg: error});
    }
  })();
});

app.get("/api/booking/get_user_bookings/:user_uid", (req, res) => {
  (async () => {
    try{
      const hotelRef = firestore.collection("booking");
      const snapshot = await hotelRef.where('user_uid', '==', req.params.user_uid).get();

      const response = snapshot.docs.map(doc => {
        return { id: doc.id, ...doc.data() };
      });

      return res.status(200).send({status:"200", msg: "sucess", data: {results: snapshot.docs.length, ...response}});
    } catch(error) {
      console.log(error);
      return res.status(500).send({status:"500", msg: error});
    }
  })();
});

app.get("/api/booking/get_number_of_collisions", (req, res) => {
  (async () => {
    try{
      var roomId = req.headers['room_id'];
      var startTime = parseInt(req.headers['start_time'],10);
      var endTime = parseInt(req.headers['end_time'],10);

      const bookingRef = firestore.collection('booking')
                                  .where('room_id', '==', roomId);
      const snapshot = await bookingRef.get();

      var collisions = 0;

      snapshot.docs.forEach(bookingDoc => {
        const start_time = bookingDoc.data()['start_time']['_seconds'];
        const end_time = bookingDoc.data()['end_time']['_seconds']
        if(isNotNumberBetween(start_time, startTime, endTime) && isNotNumberBetween(end_time, startTime, endTime)){
          collisions++;
        }
      });

      return res.status(200).send({status:"200", msg: "sucess", length: collisions});
    } catch(error) {
      console.log(error);
      return res.status(500).send({status:"500", msg: error});
    }
  })();
});

function isNumberBetween(checkNum, lowNum, highNum){
  return (checkNum > lowNum && checkNum < highNum);
}

function isNotNumberBetween(checkNum, lowNum, highNum){
  return !(checkNum > lowNum && checkNum < highNum);
}


//post -> post()
//app.post("/api/hotel/booking/evaluate/:id")



//export the api to firebase cloud function
exports.app = functions.https.onRequest(app);