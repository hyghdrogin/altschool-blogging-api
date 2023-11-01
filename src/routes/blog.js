const express = require("express");
const {
	createBlog, readSingleBlog, fetchBlogs,
	ownerBlog, updateBlog, updatePrefill,
	deleteBlog, readOwnerSingleBlog
} = require("../controllers/blog.js");
const { verifyToken } = require("../middlewares/authentication.js");
const logger = require("../utils/logger.js");
const { splitTags } = require("../utils/helpers.js");


const router = express.Router();

router.get("/create", (req, res) => {
	res.render("createBlog");
});

router.post("/", verifyToken, splitTags, createBlog);

router.get("/:blogId", readSingleBlog);
router.get("/", async(req, res) => {
	try {
		const response = await fetchBlogs(req);
		return res.status(200).render("viewBlogs", {
			total: response.total,
			totalPages: response.totalPages,
			currentPage: response.currentPage,
			blogs: response.blogs,
		});
	} catch (error) {
		logger.error(`Error fetching blogs: ${error.message}`);
		return res.status(500).json({
			status: false,
			message: "Internal server error",
		});
	}    
});
router.get("/owner/author", verifyToken, ownerBlog);
router.get("/owner/author/:blogId", verifyToken, readOwnerSingleBlog);
router.get("/update/:blogId", verifyToken, updatePrefill);

router.post("/update/:blogId", verifyToken, updateBlog);

router.get("/delete/:blogId", verifyToken, deleteBlog);

module.exports = router;