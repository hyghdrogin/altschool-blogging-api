const express = require("express");
const {
	createBlog, readSingleBlog, fetchBlogs,
	ownerBlog, updateBlog, updatePrefill, deleteBlog
} = require("../controllers/blog.js");
const { verifyToken } = require("../middlewares/authentication.js");
const logger = require("../utils/logger.js");

const router = express.Router();

router.post("/", verifyToken, createBlog);

router.get("/:blogId", readSingleBlog);
router.get("/", async(req, res) => {
	try {
		const response = await fetchBlogs(req);
		return res.status(200).render("homepage", {
			currentPage: response.currentPage,
			blog: response.blog,
		});
	} catch (error) {
		logger.error(`Error fetching blogs: ${error.message}`);
		return res.status(500).json({
			status: false,
			message: "Internal server error",
		});
	}    
});
router.get("/:userId", verifyToken, ownerBlog);
router.get("/update/:blogId", verifyToken, updatePrefill);

router.post("/update/:blogId", verifyToken, updateBlog);

router.get("/delete/:blogId", verifyToken, deleteBlog);
