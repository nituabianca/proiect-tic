const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const routes = require("./routes");
const app = express();

const dotenv = require("dotenv");

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cors());
dotenv.config();

app.use("/api", routes);

app.listen(process.env.PORT, () => {
  console.log(`Project is running on http://localhost:${process.env.PORT}`);
});
