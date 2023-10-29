const express = require("express");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");
const router = require("../routes/index.js");
const { fetchBlogs } = require("../controllers/blog.js");
const requestLogger = require("../middlewares/reqLogger.js");

const createServer = () => {
	const app = express();
	app.use(express.json());
	app.set("views", path.join(__dirname, "../views"));
	app.set("view engine", "ejs");

	app.use(cors());
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(bodyParser.json());
	app.use(requestLogger);

	app.use("/", router);

	app.get("/", async (req, res) => {
		const response = await fetchBlogs(req);
		console.log(response);
		return res.status(200).render("homepage", {
			currentPage: response.currentPage,
			blog: response.blog,
		});
	});
	
	app.use((req, res) => res.status(404).render("404"));

	return app;
};

module.exports = createServer;