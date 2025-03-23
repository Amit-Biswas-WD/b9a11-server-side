const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

//middlewere
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yit3t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// middlewere
const logger = async (req, res, next) => {
  console.log("log: info", req.host, req.url);
  next();
};

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  console.log("token in the middleware", token);

  if (!token) {
    return res.status(401).send({ message: "Token missing or invalid" });
  }

  jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, (err, decoded) => {
    if (err) {
      console.error("Token verification error:", err);
      return res.status(401).send({ message: "Token expired or invalid" });
    }

    console.log("value in the token", decoded);
    req.user = decoded;
    next();
  });
};

const cookieOption = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  secure: process.env.NODE_ENV === "production" ? true : false,
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const serviceCollection = client.db("harMoney").collection("services");
    const bookingCollections = client.db("harMoney").collection("booking");

    app.post("/jwt", logger, async (req, res) => {
      const user = req.body;
      console.log("user for token", user);
      const token = jwt.sign(user, process.env.ACCESS_SECRET_TOKEN, {
        expiresIn: "24h",
      });
      res
        .cookie("token", token, cookieOption, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .send({ success: true });
    });

    app.post("/logout", async (req, res) => {
      const user = req.body;
      console.log("logging out ", user);
      res
        .clearCookie("token", { ...cookieOption, maxAge: 0 })
        .send({ success: true });
    });

    app.get("/services", logger, async (req, res) => {
      const cursor = serviceCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const options = {
        // Include only the `title` and `imdb` fields in the returned document
        projection: { date: 1, price: 1, service_id: 1, img: 1, size: 1 },
      };

      const result = await serviceCollection.findOne(query);
      res.send(result);
    });

    app.get("/booking", logger, async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) {
        query = { email: email };
      }
      const result = await bookingCollections.find(query).toArray();
      res.send(result);
    });

    app.post("/booking", async (req, res) => {
      const booking = req.body;
      console.log(booking);
      const result = await bookingCollections.insertOne(booking);
      res.send(result);
    });

    app.get("/booking/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollections.findOne(query);
      res.send(result);
    });

    app.put("/booking/:id", async (req, res) => {
      const id = req.params.id;
      const booking = req.body;
      console.log(id, booking);
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateValue = {
        $set: {
          data: booking.data,
          rating_4: booking.rating_4,
          price: booking.price,
          size: booking.size,
          img: booking.img,
          offer: booking.offer,
        },
      };
      const result = await bookingCollections.updateOne(
        filter,
        updateValue,
        options
      );
      res.send(result);
    });

    app.delete("/booking/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollections.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Harmony is running");
});

app.listen(port, () => {
  console.log(`Harmony server in running on port ${port}`);
});
