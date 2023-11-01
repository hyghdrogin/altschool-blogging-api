const express = require("express");
const { userRegistration, userLogin, logOut, viewUser } = require("../controllers/user.js");

const router = express.Router();

router.get("/register", (req, res) => {
	res.render("register");
});
  
router.get("/login", (req, res) => {
	res.render("login");
});

router.get("/dashboard", (req, res) => {
	res.render("dashboard");
});

router.post("/", userRegistration);
router.post("/login", userLogin);

router.get("/blog/:username", viewUser);
router.get("/logout", logOut);

module.exports = router;