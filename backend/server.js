const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const cors = require("cors");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const session = require("express-session");
const LocalStrategy = require("passport-local").Strategy;

const app = express();
app.use(cors());
app.use(bodyParser.json());
const port = 3010;
const jwt_Secret = "sec123abc";

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Milat433464",
  database: "mydb",
});
app.use(
  session({
    secret: jwt_Secret,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  res.json("Hello from Backend");
});

app.post("/signup", (request, response) => {
  const { username, password } = request.body;
  db.query(
    "SELECT * FROM users WHERE username = ?",
    [username],
    (error, results) => {
      if (error) {
        console.error(error);
        response.status(500).send("Error checking username");
        return;
      }

      if (results.length > 0) {
        response.status(409).send("Username already exists");
        return;
      }

      db.query(
        "INSERT INTO users (username, password) VALUES (?, ?)",
        [username, password],
        (error) => {
          if (error) {
            console.error(error);
            response.status(500).send("Error creating user");
          } else {
            response.send("User created successfully");
          }
        }
      );
    }
  );
});

/*app.post("/login", (request, response) => {
  const { username, password } = request.body;
  const query = `SELECT * FROM users WHERE username="${username}" AND password="${password}"`;
  db.query(query, (error, results) => {
    if (error) {
      console.error(error);
      response.status(500).send("Internal server error");
    } else {
      if (results.length > 0) {
        response.send("User registered, you are logged in");
      } else {
        response.send("This user doesn't exist");
      }
    }
  });
}); */

passport.use(
  new LocalStrategy(function (username, password, done) {
    const query = `SELECT * FROM users WHERE username="${username}" AND password="${password}"`;
    db.query(query, (error, results) => {
      if (error) {
        return done(error);
      }
      if (results.length === 0) {
        return done(null, false, { message: "Incorrect username or password" });
      }
      return done(null, results[0]);
    });
  })
);

passport.serializeUser((user, done) => {
  done(null, user.user_id);
});

passport.deserializeUser((id, done) => {
  const query = `SELECT * FROM users WHERE user_id="${id}"`;
  db.query(query, (err, results) => {
    done(err, results[0]);
  });
});

app.post("/login", passport.authenticate("local"), function (req, res) {
  const token = jwt.sign(
    { userId: req.user.user_id, username: req.user.username },
    jwt_Secret,
    { expiresIn: "1h" }
  );
  console.log(token);
  res.send("User Authenticated and logged in");
});

app.post("/newpost", (request, response) => {
  const { author, content } = request.body;
  db.query(
    "INSERT INTO posts (author, content) VALUES (?, ?)",
    [author, content],
    (error) => {
      if (error) {
        console.error(error);
        response.status(500).send("Error creating post");
      } else {
        response.send("Post created successfully");
      }
    }
  );
});
app.get("/posts", (request, response) => {
  db.query("SELECT * FROM posts", (error, data) => {
    if (error) {
      console.error(error);
      response.status(500).send("Error retriving posts");
    } else {
      response.send(data);
    }
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});
