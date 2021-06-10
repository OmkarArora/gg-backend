require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { errorHandler } = require("./middleware/errorHandler");
const {requestInfo} = require("./middleware/requestInfo")
const { initDBConnection } = require("./db.connect");

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(requestInfo);

initDBConnection();

const userRouter = require("./routers/user.router");
app.use("/users", userRouter);

app.get("/", (req, res) => {
  res.send("Connected to GG server");
});

// Catching errors
app.use(errorHandler);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log("SERVER STARTED on port: ", PORT);
});
