const express = require("express");
const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = 8080;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ["secret-keys"],
}));

//Databases
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "userRandomID"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "user2RandomID"
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

//Functions

//This fucntion returns user object of the email if found.
const getUserByEmail = require('./helpers');

const generateRandomString = function(length = 6) {
  let result  = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const getUserObject = function(user_id) {
  let currentUser = null;
  for (let user in users) {
    console.log(user_id, user);
    if (user_id === user) {
      currentUser = users[user];
    }
  }
  return currentUser;
};

const doesEmailExist = function(email) {
  let result = false;
  for (let key in users) {
    if (users[key].email === email) {
      result = true;
      break;
    }
  }
  return result;
};

const urlsForUser = function(id) {
  let userUrls = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      userUrls[url] = urlDatabase[url];
    }
  }
  return userUrls;
};

app.get("/", (req, res) => {
  if (!req.session.user_id) {
    res.redirect('/login');
  }
});

app.get("/urls", (req, res) => {

  let currentUser = getUserObject(req.session.user_id);
  let userUrls = urlsForUser(req.session.user_id);

  const templateVars = {
    user: currentUser,
    urls: userUrls
  };
  res.render("urls_index", templateVars);
});

//this needs to be placed before the get /urls/:id
//routes should be ordered from most specific to least specific.
app.get("/urls/new", (req, res) => {
 
  if (!req.session.user_id) {
    res.redirect('/login');
  }

  let currentUser = getUserObject(req.session.user_id);
  const templateVars = {
    user: currentUser
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {

  if (!req.session.user_id) {
    res.redirect('/login');
  }
  
  let currentUser = getUserObject(req.session.user_id);

  if (!urlDatabase[req.params.shortURL]) {
    return res.send("Error: Short URL not found");
  }

  if (req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    return res.send("Need to login first");
  }
  
  const templateVars = {
    user: currentUser,
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL
  };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {

  if (!req.session.user_id) {
    return res.send("Need to login/register first");
  }

  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  
  urlDatabase[shortURL] = { longURL: longURL, userID: req.session.user_id};
  
  res.redirect(`/urls`);
});

app.get("/u/:shortURL", (req, res) => {
  const URL = urlDatabase[req.params.shortURL];
  
  if (!URL) {
    return res.send("<h3>Long URL does not exist!</h3>");
  }
  
  res.redirect(URL.longURL);
});

app.post('/urls/:shortURL/delete', (req, res) =>{
  
  if (!req.session.user_id) {
    res.redirect('/login');
  }

  if (req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    return res.send("Need to login first");
  }

  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  
  res.redirect('/urls');
});

app.post('/urls/:shortURL', (req, res) => {
  if (!req.session.user_id) {
    return res.redirect('/login');
  }

  if (req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    return res.send("Need to login first");
  }

  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  
  urlDatabase[shortURL].longURL = longURL;

  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  //To clear cookies after log out
  req.session = null;
  res.redirect('/urls');
});

app.get("/login", (req, res) => {
  let currentUser = getUserObject(req.session.user_id);
  
  const templateVars = {
    user: currentUser
  };
  res.render("urls_login", templateVars);
});

app.post('/login', (req, res) => {
  
  if (!req.body.email || !req.body.password) {
    res.status(403).send("Invalid email or password");
    return;
  }

  const user_id = getUserByEmail(req.body.email, users);
  if (user_id === null) {
    res.status(403).send("Email does not exist");
    return;
  }

  if (!(bcrypt.compareSync(req.body.password, users[user_id].password))) {
    res.status(403).send("Wrong Password");
    return;
  }
  
  req.session['user_id'] = user_id;

  res.redirect('/urls');
});

app.get("/register", (req, res) => {
  let currentUser = getUserObject(req.session.user_id);
  
  const templateVars = {
    user: currentUser
  };
  res.render("urls_register", templateVars);
});

app.post('/register', (req, res) => {
  
  if (!req.body.email || !req.body.password) {
    res.status(400).send("Invalid email or password");
    return;
  }

  if (doesEmailExist(req.body.email)) {
    res.status(400).send("Email already exists");
    return;
  }

  let user_id = generateRandomString();
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);
  let user = {
    id: user_id,
    email: req.body.email,
    password: hashedPassword
  };
  users[user_id] = user;

  req.session["user_id"] = user_id;

  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});