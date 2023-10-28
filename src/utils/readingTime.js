const calculateReadingTime = (blog) => {
	const words = blog.split(" ");
	const wordCount = words.length;
	const readingTime = Math.round(wordCount / 100);
	return readingTime;
};
  
module.exports = { calculateReadingTime };