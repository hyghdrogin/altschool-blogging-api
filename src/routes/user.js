const express = require("express");
const { userRegistration, userLogin, logOut } = require("../controllers/user.js");

const router = express.Router();

router.post("/", userRegistration);
router.post("/login", userLogin);

router.get("/logout", logOut);

module.exports = router;