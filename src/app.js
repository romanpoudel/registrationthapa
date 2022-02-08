require('dotenv').config(); 
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
require("./db/conn");
const path = require("path");
const hbs = require("hbs");
const cookieParser=require('cookie-parser');

const static_path = path.join(__dirname, "../public");
const template_path = path.join(__dirname, "../templates/views");
const partials_path = path.join(__dirname, "../templates/partials");

const Register = require("./models/registers");
const { json } = require("express");

const bcrypt = require("bcrypt");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(static_path));
app.set("view engine", "hbs");
app.set("views", template_path);
hbs.registerPartials(partials_path);

// console.log(path.join(__dirname,'../public'))
app.get("/", (req, res) => {
  res.render("index");
});
app.get("/secret", (req, res) => {
    console.log(`this is the secret ${req.cookies.jwt}`);
    res.render("secret");
  });

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  try {
    const password = req.body.password;
    const cpassword = req.body.confirmpassword;

    if (password === cpassword) {
      const registerEmployee = new Register({
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: req.body.email,
        gender: req.body.gender,
        phone: req.body.phone,
        age: req.body.age,
        password: password,
        confirmpassword: cpassword,
      });

      const token = await registerEmployee.generateAuthToken();
      
    //   cookies
    res.cookie('jwt',token,{
        expires:new Date(Date.now()+30000),
        httpOnly:true
    });

      const registered = await registerEmployee.save();
      res.status(201).redirect("/");
    } else {
      res.send("password not matching.");
    }
  } catch (error) {
    res.status(400).send(error);
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const useremail = await Register.findOne({ email: email });
    // res.send(useremail);
    // console.log(useremail);
    

    const isMatch = await bcrypt.compare(password, useremail.password);

    const token = await useremail.generateAuthToken();

    res.cookie('jwt',token,{
        expires:new Date(Date.now()+30000),
        httpOnly:true,
        // secure:true works only for https
    });
   
    if (isMatch) {
      res.status(201).redirect("/");
    } else {
      res.status(400).send("password are not matching");
    }
  } catch (error) {
    res.status(400).send(error);
  }
});

app.listen(port, () => {
  console.log(`server is running at port ${port}`);
});
