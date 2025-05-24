const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://playful-bavarois-a2bfd7.netlify.app",
    ],
    credentials: true,
  })
);
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yit3t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const serviceCollection = client.db("harMoney").collection("services");
    const bookingCollections = client.db("harMoney").collection("booking");

    app.get("/services", async (req, res) => {
      const result = await serviceCollection.find().toArray();
      res.send(result);
    });

    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await serviceCollection.findOne(query);
      res.send(result);
    });

    app.get("/booking", async (req, res) => {
      const email = req.query.email;
      const query = email ? { email } : {};
      const result = await bookingCollections.find(query).toArray();
      res.send(result);
    });

    app.get("/booking/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollections.findOne(query);
      res.send(result);
    });

    app.post("/booking", async (req, res) => {
      const booking = req.body;
      const result = await bookingCollections.insertOne(booking);
      res.send(result);
    });

    app.put("/booking/:id", async (req, res) => {
      const id = req.params.id;
      const booking = req.body;
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

    // await client.db("admin").command({ ping: 1 });
    console.log(" Successfully connected to MongoDB!");
  } finally {
    // You may close the client when needed
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Harmony is running");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

