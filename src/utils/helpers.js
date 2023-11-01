const calculateReadingTime = (blog) => {
	const words = blog.split(/\s+/);
	const wordCount = words.length;
	const readingTime = Math.ceil(wordCount / 100);
	return readingTime;
};

const splitTags = (req, res, next) => {
	if (req.body.tags) {
		req.body.tags = req.body.tags.split(",").map(tag => tag.trim());
	}
	next();
};
  
module.exports = { calculateReadingTime, splitTags };