require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { errorHandler } = require("./middleware/errorHandler");
const { requestInfo } = require("./middleware/requestInfo");
const { initDBConnection } = require("./db.connect");

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(requestInfo);

initDBConnection();

const usersRouter = require("./routers/users.router");
app.use("/users", usersRouter);

const postsRouter = require("./routers/posts.router");
app.use("/posts", postsRouter);

const postsDetailsRouter = require("./routers/posts.details.router");
app.use("/post-details", postsDetailsRouter);

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
