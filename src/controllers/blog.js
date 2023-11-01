/* eslint-disable quotes */
const models = require("../models/index.js");
const logger = require("../utils/logger.js");
const { validateCreatingBlog } = require("../validations/blog.js");
const { calculateReadingTime } = require("../utils/helpers.js");

const createBlog = async(req, res) => {
	const { username } = req.user;

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
			author: username,
			tags: value.tags,
			body: value.body,
			readingTime: calculateReadingTime(value.body)
		});
		user.blogs.push(blog._id);
		user.save();

		blog.readCount++;
		await blog.save();
		return res.status(201).render("viewBlog", {
			blog, user, blogId: blog._id
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
		const blog = await models.Blog.findById(blogId);
		console.log(blog);
		if (!blog || blog.state === "draft") {
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

		blog.readCount++;
		await blog.save();

		return res.status(200).render("viewBlog", ({
			blog, blogId, author: blog.author
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
	
	let query = { state: "published", deleted: false };
  
	if (search) {
		const searchRegex = new RegExp(search, 'i');
		query.$or = [
			{ title: { $regex: searchRegex } },
			{ author: { $regex: searchRegex } },
			{ tags: { $elemMatch: { $regex: searchRegex } } } 
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
		blogs: blog,
	};
};
  

const ownerBlog = async (req, res) => {
	const { username } = req.user;
	let { page, limit, state } = req.query;
	
	try {
		page = page || 1;
		limit = limit || 20;
  
		const startIndex = (page - 1) * limit;
		const endIndex = page * limit;
  
		let query = { username };

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
  
		return res.status(200).render("viewBlogs", {
			total,
			totalPages,
			currentPage: page,
			blogs: blog,
		});
	} catch (error) {
		logger.error(`Error fetching blogs: ${error.message}`);
		return res.status(500).json({
			status: false,
			message: "Internal server error",
		});
	}
};

const readOwnerSingleBlog = async(req, res) => {
	const { username } = req.user;
	const { blogId } = req.params;

	try {
		const blog = await models.Blog.findById(blogId);
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

		blog.readCount++;
		await blog.save();

		return res.status(200).render("viewBlog", ({
			blog, blogId, author: username
		}));
	} catch (error) {
		logger.error(`Error reading blog: ${error.message}`);
		return res.status(500).json({
			status: false,
			message: "Internal server error"
		});
	}
};

const updateBlog = async(req, res) => {
	const { username } = req.user;
	const { blogId } = req.params;
	try {
		const blog = await models.Blog.findOne({ _id: blogId, author: username });
        
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

		if (username !== blog.author) {
			return res.status(403).json({
				status: false,
				message: "You can not update this blog"
			});
		}
		const updateObject = {};
		if (req.body.title) updateObject.title = req.body.title;
		if (req.body.description) updateObject.description = req.body.description;
		if (req.body.state) updateObject.state = req.body.state;
		if (req.body.body) updateObject.body = req.body.body;
		if (req.body.tags) updateObject.tags = req.body.tags;

		const updatedBlog = await models.Blog.findByIdAndUpdate(blogId, updateObject, { new: true });
  
		return res.status(200).render("viewBlog", {
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
		if (username !== blog.author) {
			return res.status(403).json({
				status: false,
				message: "You can not update this blog authorized"
			});
		}

		return res.status(200).render("update", ({
			blog, blogId, author: username
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
		if (username !== blog.author) {
			return res.status(403).json({
				status: false,
				message: "You can not delete this blog"
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
	createBlog, readSingleBlog, fetchBlogs,
	ownerBlog, updateBlog, updatePrefill,
	readOwnerSingleBlog, deleteBlog
};