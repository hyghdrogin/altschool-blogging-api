const express = require("express");
const userRoute = require("./user.js");
const blogRoute = require("./blog.js");

const router = express.Router();

router.use("/users", userRoute);
router.use("/blogs", blogRoute);

module.exports = router;