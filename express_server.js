const express = require("express");
const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const methodOverride = require('method-override');


const app = express();
const PORT = 8080;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ["secret-keys"],
}));

// override with POST having ?_method=DELETE or ?_method=PUT in ejs
app.use(methodOverride('_method'));

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

//This fucntion returns user object of the email if found in database
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

//Add urls associated with that user to user database using id.
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
    //res.redirect('/login');
    res.send("Please <a href='/login'>Log in</a> first or <a href='/register'>Register</a> if new user! Thank you.");
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

  //Check if short url is from user database
  if (!urlDatabase[req.params.shortURL]) {
    return res.send("Error: Short URL not found");
  }

  if (req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    return res.send("Need to <a href='/login'>login</a> first");
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
    return res.send("Need to <a href='/login'>login</a> or <a href='/register'>register</a> first");
  }

  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  
  //Adding user_id to url database and associating it with short url key
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

app.delete('/urls/:shortURL', (req, res) =>{
  //Check if user is logged in
  if (!req.session.user_id) {
    res.redirect('/login');
  }

  if (req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    return res.send("Need to <a href='/login'>login</a> first");
  }

  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  
  res.redirect('/urls');
});

app.put('/urls/:shortURL', (req, res) => {
  //Check if user is logge in
  if (!req.session.user_id) {
    return res.redirect('/login');
  }

  //checking if cookie is not matching existing userIDs
  if (req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    return res.send("Need to <a href='/login'>login</a> first");
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
  
  //Checking if email or password fields are empty
  if (!req.body.email || !req.body.password) {
    res.status(403).send("Invalid email or password. Please <a href='/login'> try again </a>");
    return;
  }

  //Use helper function to see if email matches existing users.
  const user_id = getUserByEmail(req.body.email, users);
  if (user_id === null) {
    res.status(403).send("Email does not exist. Please <a href='/login'>try again</a> or <a href='/register'>register</a> if new user.");
    return;
  }

  //Checking if password existing password for associated email
  if (!(bcrypt.compareSync(req.body.password, users[user_id].password))) {
    res.status(403).send("Wrong Password. Please <a href='/login'> try again </a>");
    return;
  }
  
  req.session['user_id'] = user_id;

  res.redirect('/urls');
});

//Registration Handler
app.get("/register", (req, res) => {
  let currentUser = getUserObject(req.session.user_id);
  
  const templateVars = {
    user: currentUser
  };
  res.render("urls_register", templateVars);
});

app.post('/register', (req, res) => {
  
  if (!req.body.email || !req.body.password) {
    res.status(400).send("Invalid email or password. Please <a href='/register'> try again </a>");
    return;
  }

  if (doesEmailExist(req.body.email)) {
    res.status(400).send("Email already exists. Please <a href='/register'> try again </a>");
    return;
  }

  let user_id = generateRandomString();
  //Using bcrypt to hash the passwords for security.
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