const user = require('../models/userModels');
const bcyptjs = require('bcryptjs');

const config = require('../config/config');

const jwt = require('jsonwebtoken');

const nodemailer = require('nodemailer');
const randomstring = require('randomstring');


const create_token = async (id) => {
  try {
    const token = await jwt.sign({ _id: id }, config.secret_jwt);
    return token;
  }
  catch (error) {
    res.status(400).send(error.message);
  }
}


const securePassword = async (password) => {

  try {
    const passwordHash = await bcyptjs.hash(password, 10);
    return passwordHash;
  }
  catch (error) {
    res.status(400).send(error.message);
  }

}


const register_user = async (req, res) => {

  try {

    const spassword = await securePassword(req.body.password);

    const users = new user({
      name: req.body.name,
      email: req.body.email,
      password: spassword,
      mobile: req.body.mobile,

      type: req.body.type
    });
    const userData = await user.findOne({ email: req.body.email });
    if (userData) {
      res.status(200).send({ success: false, msg: "This email is already exists" });
    }
    else {
      const user_data = await users.save();
      res.status(200).send({ success: true, data: user_data });
    }
  }
  catch (error) {

    res.status(400).send(error.message);
  }

}

// Log in method::::::

const user_login = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const userData = await user.findOne({ email: email });

    if (userData) {
      const passwordMatch = await bcyptjs.compare(password, userData.password);

      // userData.password is a hashing password

      if (passwordMatch) {

        const tokenData = await create_token(userData._id);

        const userResult = {
          _id: userData._id,
          name: userData.name,
          email: userData.email,
          password: userData.password,

          mobile: userData.mobile,
          type: userData.type,
          token: tokenData
        }
        const response = {
          success: true,
          msg: "User Details",
          data: userResult
        }
        res.status(200).send(response);

      }
      else {
        res.status(200).send({ success: false, msg: "Login details are incorrect" });
      }
    }
    else {
      res.status(200).send({ success: false, msg: "Login details are incorrect" });
    }

  }
  catch (error) {
    res.status(400).send(error.message)
  }
}


// UPDATE PASSWORD:::::::::::::::::::::

const update_password = async (req, res) => {

  try {

    const user_id = req.body.user_id;
    const password = req.body.password;


    const mydata = await user.findOne({ _id: user_id });
    if (mydata) {

      const newPassword = await securePassword(password);
      const userData = await user.findByIdAndUpdate({ _id: user_id }, {
        $set: { password: newPassword }
      });
      res.status(200).send({ success: true, msg: "Your password has been updated" });

    }
    else {
      res.status(200).send({ success: false, msg: "User ID is not found" });
    }





  } catch (error) {

    res.status(400).send(error.message);

  }


}

// forget password::::

//pehle hm resetpassword ke liye ek method banayenge jo ki email send krega::

const sendResetPasswordMail = async (name, email, token) => {

  try {

    const transporter = nodemailer.createTransport({

      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: config.emailUser,
        pass: config.emailPassword
      }
    });

    const mailOption = {
      from: config.emailUser,
      to: email,   //wo email me mail send hoga jo ki pass hoke aaya hai async fun me
      subject: "For Reset Password",
      html: '<p> Hii ' + name + ', Please click the link and <a href="http://127.0.0.1:3000/api/reset-password?token=' + token + '"> reset your password </a>'
    }
    transporter.sendMail(mailOption, function (error, info) {

      if (error) {
        console.log(error);
      }
      else {
        console.log("Mail has been sent:- " + info.response);
      }

    })

  } catch (error) {

    console.log(error);
    // res.status(400).send({ success: false, msg: error.message });
  }

}
// // // // 

const forget_password = async (req, res) => {

  try {

    const email = req.body.email;
    const userData = await user.findOne({ email: email });


    if (userData) {


      const randomString = randomstring.generate();  // token
      const data = await user.updateOne({ email: email }, { $set: { token: randomString } });
      sendResetPasswordMail(userData.name, userData.email, randomString);
      res.status(200).send({ success: true, msg: "please check your email and reset password" })


    }
    else {
      res.status(200).send({ success: true, msg: "This email does not exists" });
    }

  } catch (error) {
    res.status(200).send({ success: false, msg: error.message });
  }

}
// hme postman me wo wala mail pass krna hai jo ki db me hai. Then us email pr hi 
// message aayega us email se jo ki hm config file me diye hain.


// reset password:::

const reset_password = async (req, res) => {

  try {

    const token = req.query.token;
    const tokenData = await user.findOne({ token: token });

    if (tokenData) {

      const password = req.body.password;
      const newPassword = await securePassword(password);
      const userData = await user.findByIdAndUpdate({ _id: tokenData._id }, { $set: { password: newPassword, token: '' } }, { new: true })
      res.status(200).send({ success: true, msg: "Password Reset Successfully", data: userData });

    }
    else {
      res.status(200).send({ success: true, msg: "This link has been expired" });
    }

  } catch (error) {

    res.status(400).send({ success: false, msg: error.message });

  }

}


module.exports = {
  register_user,
  user_login,
  update_password,
  forget_password,
  reset_password

}