const products = require("./products.json");
const users = require("./users.json");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const port = process.env.PORT || 5000;
const fs = require("fs");

function get_last_user_id(users) {
  let last_user = users[Object.keys(users)[Object.keys(users).length - 1]];
  return last_user.id + 1;
}

function get_last_product_id(products) {
  let last_item = products[products.length - 1];
  return last_item.id + 1;
}

let user_id = get_last_user_id(users);
let product_id = get_last_product_id(products);

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(cors());
app.use(bodyParser.json());

/*
add new user if username in not already exists and password is strong enough 
 */
app.post("/api/registerNewUser", async (req, res) => {
  let userName = req.body.userName;
  let passWord = req.body.passWord;
  try {
    if (!validateUserPassword(passWord)) {
      res.send({ registered: false, reason: "Password is not valid" });
    } else if (users[userName] == null) {
      users[userName] = {
        username: userName,
        id: user_id++,
        password: passWord,
        cart: [],
      };

      fs.writeFileSync("users.json", JSON.stringify(users, null, 2));
      console.log("Succesfully create user");
      res.send({ registered: true });
    } else {
      console.log("User already exist");
      res.send({ registered: false, reason: "already exist" });
    }
  } catch (e) {
    console.log(e);
  } finally {
  }
});

function validateUserPassword(password) {
  return (
    containsNumber(password) &&
    isLongEnough(password) &&
    isNotTooLong(password) &&
    containsCapitalLetter(password) &&
    notCaontainsEvalReg(password)
  );
}

function containsNumber(password) {
  return /\d/.test(password);
}

function isLongEnough(password) {
  return password.length >= 5;
}

function isNotTooLong(password) {
  return password.length < 13;
}

function notCaontainsEvalReg(password) {
  let format = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
  return !format.test(password);
}

function containsCapitalLetter(password) {
  for (var i = 0; i < password.length; i++) {
    if (
      password.charAt(i) == password.charAt(i).toUpperCase() &&
      password.charAt(i).match(/[a-z]/i)
    ) {
      return true;
    }
  }
  return false;
}

/*
check if the user exists and the password is correct
 */

app.post("/api/login", async (req, res) => {
  let userName = req.body.userName;
  let passWord = req.body.passWord;
  let rememberMe = req.body.rememberMe;
  console.log("userName", userName);
  console.log("passWord", passWord);
  let user = users[userName];
  if (user === undefined) {
    console.log("Not register");
    res.send({ registered: false });
  } else if (user.password != passWord) {
    console.log("Not correct password");
    res.send({ registered: false, reason: "wrong password" });
  } else {
    console.log("Register");
    res.send({ id: user.id, registered: true });
    console.log("id", user.id);
  }
});

/*
get all exiisting products 
 */
app.get("/api/getAllProducts", async (req, res) => {
  console.log(`got products`);
  res.send(products);
});

/*
add a product from home page to cart
 */

app.get("/api/addProductToCart", async (req, res) => {
  let userId = req.query.userId;
  let productId = req.query.productId;
  let productToAdd = get_product_by_id(productId);
  let user = get_user_by_id(userId);

  if (user == null) {
    console.log(`no user with id ${userId}`);
    res.sendStatus(500);
  } else {
    let ind = -1;
    user.cart.forEach((element, index) => {
      if (element.id == productToAdd.id) {
        ind = index;
        return;
      }
    });
    if (ind !== -1) {
      res.send("include");
    } else {
      console.log(`add product with id ${productId} to cart`);

      let newCart = user.cart;
      newCart.push(productToAdd);
      user.cart = newCart;

      save_user(user);
      res.send(user.cart);
    }
  }
});

/*
delete a product from user cart
 */
app.get("/api/removeProductFromCart", async (req, res) => {
  let userId = req.query.userId;
  let productId = req.query.productId;
  let user = get_user_by_id(userId);
  let newCart = user.cart.filter(
    (element) => element.id != parseInt(productId)
  );

  console.log("newCart", JSON.stringify(newCart));
  user.cart = newCart;
  save_user(user);
  res.send(user.cart);
});

/*
get user choosen products
 */
app.get("/api/getCart", async (req, res) => {
  let id = req.query.id;
  console.log(id);
  let user = get_user_by_id(id);
  res.send(user.cart);
  console.log("cart", user.cart);
  res.end();
});

/*
get user choosen products
 */
app.post("/api/emptyCart", async (req, res) => {
  let userId = req.query.id;
  let user = get_user_by_id(userId);
  if (user != null) {
    user.cart = [];
    save_user(user);
    res.status(200);
    res.send([]);
  } else {
    res.sendStatus(500);
  }
  res.end();
});

/*
add new product, only can be done by admin user
 */
app.post("/api/addNewProduct", async (req, res) => {
  let userName = req.body.userName;
  if (userName == "admin") {
    console.log("username in add product is ", userName);
    let name = req.body.name;
    let price = parseInt(req.body.price);
    let description = req.body.description;
    let image = req.body.image;
    try {
      let product = get_product_by_name(name);
      if (product === null) {
        let newProduct = {
          id: product_id++,
          name: name,
          price: price,
          description: description,
          image: image,
        };
        console.log(product_id);
        save_product(newProduct);
        console.log("saved new product");
        res.send(newProduct);
      } else {
        console.log("Item exist");
        res.send("Item exist");
      }
    } catch (e) {
      res.status = 400;
      console.log(e);
    } finally {
      res.status = 400;
    }
  } else {
    res.status = 400;
    console.log("is not admin");
    res.send("is not admin");
  }
});

/*
delete existing product, only can be done by admin user
 */
app.delete("/api/deleteProduct", async (req, res) => {
  let userName = req.query.username;
  if (userName == "admin") {
    let id = req.query.id;
    let ind = -1;

    try {
      let product = get_product_by_id(id);
      if (products[product] === null) {
        res.send("product is not exist");
      } else {
        products.forEach((element, index) => {
          console.log("productId", JSON.stringify(element.id));
          if (element.id === parseInt(id)) {
            ind = index;
            console.log("ind", ind);
            return;
          }
        });
        let newproducts = products;
        newproducts.splice(ind, 1);
        console.log("newproducts", JSON.stringify(newproducts));
        fs.writeFileSync("products.json", JSON.stringify(products, null, 2));
        res.send("deleted successfuly");
      }
    } catch (e) {
      console.log(e);
    } finally {
    }
  } else {
    res.status = 400;
    console.log("is not admin");
    res.send("is not admin");
  }
});

/*
save user in db
 */
function save_user(user) {
  users[user.username] = user;
  fs.writeFileSync("users.json", JSON.stringify(users, null, 2));
}
/*
get user from db by id
 */
function get_user_by_id(userId) {
  for (let user in users) {
    if (users[user].id == userId) {
      return users[user];
    }
  }
  return null;
}

/*
get priduct from db by id
 */
function get_product_by_id(productId) {
  for (let product in products) {
    if (products[product].id == parseInt(productId)) {
      return products[product];
    }
  }
}

/*
get priduct from db by name
 */
function get_product_by_name(name) {
  for (let product in products) {
    if (products[product].name == name) {
      return products[product];
    }
  }
  return null;
}

/*
save product in db
 */
function save_product(product) {
  products.push(product);
  fs.writeFileSync("products.json", JSON.stringify(products, null, 2));
}

// This displays message that the server running and listening to specified port
app.listen(port, () => console.log(`Listening on port ${port}`));
