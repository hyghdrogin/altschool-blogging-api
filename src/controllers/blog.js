const models = require("../models/index.js");
const logger = require("../utils/logger.js");
const { validateCreatingBlog } = require("../validations/blog.js");
const { calculateReadingTime } = require("../utils/readingTime.js");

const createBlog = async(req, res) => {
	const username = req.user;

	try {
		const user = await models.User.findOne({ username });
		const { error, value } = validateCreatingBlog(req.body);
		if(error) {
			return res.status(400).send({
				status: false,
				message: error.message
			});
		}
		const blog = await models.Blog.create({
			title: value.title,
			description: value.description,
			author: user._id,
			tags: value.tags,
			body: value.body,
			reading_time: calculateReadingTime(value.body)
		});
		user.blogs.push(blog._id);
		user.save();
		return res.status(201).render("viewBlog", {
			blog, user
		});
	} catch (error) {
		logger.error(`Error creating blog: ${error.message}`);
		return res.status(500).send({
			status: false,
			message: "Internal server error"
		});
	}
};

const readSingleBlog = async(req, res) => {
	const { blogId } = req.params;

	try {
		const blog = await models.Blog.findOne({ _id: blogId }, { state: "published"});
		if (!blog) {
			return res.status(404).json({
				status: false,
				message: "Blog not found"
			});
		}
		if (blog.deleted) {
			return res.status(204).json({
				status: false,
				message: "Invalid Blog Id"
			});
		}
		return res.status(200).render("viewBlog", ({
			blog, blogId
		}));
	} catch (error) {
		logger.error(`Error reading blog: ${error.message}`);
		return res.status(500).send({
			status: false,
			message: "Internal server error"
		});
	}
};

const fetchBlogs = async (req, res) => {
	let { page, limit, search, order, orderBy } = req.query;
  
	try {
		page = page || 1;
		limit = limit || 20;
  
		const startIndex = (page - 1) * limit;
		const endIndex = page * limit;
  
		let query = {};
        
		if (search) {
			query.$or = [
				{ title: { $regex: search, $options: "i" } },
				{ author: { $regex: search, $options: "i" } },
				{ tags: { $regex: search, $options: "i" } },
			];
		}

		let sort = {};
		if (order && orderBy) {
			if (orderBy === "read_count" || orderBy === "reading_time" || orderBy === "timestamp") {
				sort[orderBy] = order === "asc" ? 1 : -1;
			}
		}
  
		const tasks = await models.Blog.find(query)
			.sort(sort)
			.limit(endIndex)
			.skip(startIndex)
			.exec();
  
		if (tasks.length < 1) {
			return res.status(204).json({
				status: true,
				message: "No content",
			});
		}
  
		const count = await models.Blog.countDocuments(query);
  
		const totalPages = Math.ceil(count / limit);
		const total = tasks.length;
  
		return res.status(200).render("viewBlog", {
			total,
			totalPages,
			currentPage: page,
			tasks,
		});
	} catch (error) {
		logger.error(`Error fetching blogs: ${error.message}`);
		return res.status(500).json({
			status: false,
			message: "Internal server error",
		});
	}
};
  

module.exports = {
	createBlog, readSingleBlog, fetchBlogs
};