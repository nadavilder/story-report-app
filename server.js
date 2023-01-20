const products = require("./products.json");
const users = require("./users.json");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const port = process.env.PORT || 5000;
const fs = require("fs");

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(cors());
app.use(bodyParser.json());

/*
get all exiisting products 
 */
app.get("/api/getAllProducts", async (req, res) => {
  console.log(`got products`);
  res.send(products);
});

/*
save product in db
 */
function save_product(product) {
  products.push(product);
  fs.writeFileSync("products.json", JSON.stringify(products, null, 2));
}

// This displays message that the server running and listening to specified port
app.listen(port, () => console.log(`Listening on port ${port}`));
