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
			return res.status(400).json({
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
			readingTime: calculateReadingTime(value.body)
		});
		user.blogs.push(blog._id);
		user.save();
		return res.status(201).render("viewBlog", {
			blog, user
		});
	} catch (error) {
		logger.error(`Error creating blog: ${error.message}`);
		return res.status(500).json({
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
		const user = await models.User.findOne({ _id: blog.author });

		blog.readCount++;
		await blog.save();

		const blogAuthor = {
			...blog,
			author: `${user.username}`
		};

		return res.status(200).render("viewBlog", ({
			blog, blogId, author: blogAuthor.author
		}));
	} catch (error) {
		logger.error(`Error reading blog: ${error.message}`);
		return res.status(500).json({
			status: false,
			message: "Internal server error"
		});
	}
};

const fetchBlogs = async (req) => {
	let { page, limit, search, order, orderBy } = req.query;
	page = page || 1;
	limit = limit || 20;
  
	const startIndex = (page - 1) * limit;
	const endIndex = page * limit;
  
	let query = { state: "published"};

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
  
	const blog = await models.Blog.find(query)
		.sort(sort)
		.limit(endIndex)
		.skip(startIndex)
		.exec();
  
	if (blog.length < 1) {
		return {
			status: true,
			message: "No content",
		};
	}
  
	const count = await models.Blog.countDocuments(query);
  
	const totalPages = Math.ceil(count / limit);
	const total = blog.length;
  
	return {
		total,
		totalPages,
		currentPage: page,
		blog,
	};
};

const ownerBlog = async (req, res) => {
	const { userId } = req.params;
	let { page, limit, state } = req.query;

	try {
		const user = await models.User.findById(userId);
		page = page || 1;
		limit = limit || 20;
  
		const startIndex = (page - 1) * limit;
		const endIndex = page * limit;
  
		let query = { user: user._id };

		if (state) {
			if (state === "draft" || state === "published") {
				query.state = state;
			}
		}

		const blog = await models.Blog.find(query)
			.limit(endIndex)
			.skip(startIndex)
			.exec();
  
		if (blog.length < 1) {
			return res.status(204).json({
				status: true,
				message: "No content",
			});
		}
  
		const count = await models.Blog.countDocuments(query);
  
		const totalPages = Math.ceil(count / limit);
		const total = blog.length;
  
		return res.status(200).render("viewBlog", {
			total,
			totalPages,
			currentPage: page,
			blog,
		});
	} catch (error) {
		logger.error(`Error fetching blogs: ${error.message}`);
		return res.status(500).json({
			status: false,
			message: "Internal server error",
		});
	}
};

const updateBlog = async(req, res) => {
	const { username } = req.user;
	const { blogId } = req.params;
	try {
		const user = await models.User.findOne({ username });
		const blog = await models.Blog.findOne({ _id: blogId, user: user._id });
        
		if (!blog) {
			return res.status(404).json({
				status: false,
				message: "blog not found",
			});
		}
  
		if (blog.deleted) {
			return res.status(204).json({
				status: true,
				message: "No content",
			});
		}

		if (user._id !== blog.author) {
			return res.status(403).json({
				status: false,
				message: "You can not update this blog authorized"
			});
		}
		const updateObject = {};
		if (req.body.title) updateObject.title = req.body.title;
		if (req.body.description) updateObject.description = req.body.description;
		if (req.body.state) updateObject.state = req.body.state;
		if (req.body.body) updateObject.body = req.body.body;
		if (req.body.tags) updateObject.tags = req.body.tags;

		const updatedBlog = await models.Blog.findByIdAndUpdate(blogId, updateObject, { new: true });
  
		return res.status(200).render("viewSingle", {
			blogId,
			blog: updatedBlog,
		});
	} catch (error) {
		logger.error(`Error updating blog: ${error.message}`);
		return res.status(500).json({
			status: false,
			message: "Internal server error",
		});
	}
};

const updatePrefill = async(req, res) => {
	const { blogId } = req.params;
	const { username } = req.user;
	try {
		const user = await models.User.findOne({ username });
		const blog = await models.Blog.findOne({ _id: blogId });
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
		if (user._id !== blog.author) {
			return res.status(403).json({
				status: false,
				message: "You can not update this blog authorized"
			});
		}

		return res.status(200).render("viewBlog", ({
			blog, blogId, author: user.username
		}));
	} catch (error) {
		logger.error(`Error fetching blog: ${error.message}`);
		return res.status(500).json({
			status: false,
			message: "Internal server error",
		});
	}
};

const deleteBlog = async(req, res) => {
	const { blogId } = req.params;
	const { username } = req.user;
	try {
		const user = await models.User.findOne({ username });
		const blog = await models.Blog.findOne({ _id: blogId });
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
		if (user._id !== blog.author) {
			return res.status(403).json({
				status: false,
				message: "You can not update this blog authorized"
			});
		}
		await models.Blog.updateOne({ _id: blog._id}, { deleted: true});
	} catch (error) {
		logger.error(`Error deleting blog: ${error.message}`);
		return res.status(500).json({
			status: false,
			message: "Internal server error",
		});
	}
};

module.exports = {
	createBlog, readSingleBlog, fetchBlogs, ownerBlog, updateBlog, updatePrefill, deleteBlog
};