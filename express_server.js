const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const { response } = require("express");

const app = express();
const PORT = 8080;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

//Databases
// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };
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
}

//Functions
const generateRandomString = function(length = 6) {
//returns random (6 alphanumeric characters) string to be used as shortURL
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
    if (user_id === user) {
      currentUser = users[user];
    }
  }
  return currentUser;
}

const getUserByEmail = function(email) {

  for (let key in users) {
    if (users[key].email === email) {
      return users[key].id;
    }
  }
  return null;
}

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
}

app.get("/urls", (req, res) => {
  
  // if (!req.cookies.user_id) {
  //   res.redirect('/login')
  // };
  let currentUser = getUserObject(req.cookies['user_id']);
 
  let userUrls = urlsForUser(req.cookies.user_id); 

  const templateVars = {
    user: currentUser,
    urls: userUrls
  };
  res.render("urls_index", templateVars);
});

//this needs to be placed before the get /urls/:id
//routes should be ordered from most specific to least specific.
app.get("/urls/new", (req, res) => {
 
  if (!req.cookies.user_id) {
    res.redirect('/login')
  };

  let currentUser = getUserObject(req.cookies['user_id']);

  const templateVars = {
    user: currentUser
  };
  res.render("urls_new", templateVars);
});

//line 58 gets redirected here
app.get("/urls/:shortURL", (req, res) => {

  if (!req.cookies.user_id) {
    res.redirect('/login')
  };
  
  let currentUser = getUserObject(req.cookies['user_id']);

  if (req.cookies.user_id !== urlDatabase[req.params.shortURL].userID) {
    return res.send("Need to login first");
  } 
  const templateVars = {
    user: currentUser,
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL
  };
  res.render("urls_show", templateVars);
});

//define route to match POST request and handle it.
app.post("/urls", (req, res) => {

  if (!req.cookies.user_id) {
    return res.send("Need to login/register first");
  }; 

  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  //storing the key value pair
  //obj['shortURL'] = value/longURL
  urlDatabase[shortURL] = { longURL: longURL, userID: req.cookies.user_id};
  
  console.log(urlDatabase);
  res.redirect(`/urls`);
});

app.get("/u/:shortURL", (req, res) => {
  //const shortURL = req.params.shortURL;
  const URL = urlDatabase[req.params.shortURL];
  
  if (!URL) {
    return res.send("<h3>Long URL does not exist!</h3>")
  }

    res.redirect(URL.longURL);
});


app.post('/urls/:shortURL/delete', (req, res) =>{
  
  if (!req.cookies.user_id) {
    res.redirect('/login')
  };

  // extract the id
  const shortURL = req.params.shortURL;
  // delete this url from db
  delete urlDatabase[shortURL];
  
  res.redirect('/urls');
});

app.post('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  
  urlDatabase[shortURL] = longURL;
  
  res.redirect('/urls');
});


app.post('/logout', (req, res) => {
  res.clearCookie("user_id");
  res.redirect('/urls');
});

app.get("/login", (req, res) => {
  let currentUser = getUserObject(req.cookies['user_id']);
  
  const templateVars = {
    user: currentUser
  };
  res.render("urls_login", templateVars);
});


app.post('/login', (req, res) => {
  
  if (!req.body.email || !req.body.password) {
  //res.send("Invalid email or password")
    res.status(403).send("Invalid email or password")
    //res.statusCode = 400
    return ;
  } 
  
  console.log(req.body.email, users)
  const user_id = getUserByEmail(req.body.email)
  if (user_id === null) {
    res.status(403).send("Email does not exist")
    return;
  }
  
  if (users[user_id].password !== req.body.password) {
    res.status(403).send("Wrong Password")
    return;
  }

  res.cookie("user_id", user_id)
  
  //console.log(users)
  res.redirect('/urls');
});

app.get("/register", (req, res) => {
  let currentUser = getUserObject(req.cookies['user_id']);
  
  const templateVars = {
    user: currentUser
  };
  res.render("urls_register", templateVars);
});

//Registration handler
app.post('/register', (req, res) => {
  
  if (!req.body.email || !req.body.password) {
    res.status(400).send("Invalid email or password")
    return ;
  } 
    
  if (doesEmailExist(req.body.email)) {
    res.status(400).send("Email already exists");
    return; 
  }; 

  let user_id = generateRandomString()
  let user = {
    id: user_id,
    email: req.body.email,
    password: req.body.password
  };
  users[user_id] = user;

  res.cookie("user_id", user_id)

  console.log(users)
  res.redirect('/urls');
})



app.get("/", (req, res) => {
  res.send("Hello!");
});

// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});