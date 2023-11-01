const Joi = require("joi");

const options = {
	stripUnknown: true,
	abortEarly: false,
	errors: {
		wrap: {
			label: ""
		}
	}
};

const validateCreatingBlog = (user) => {
	const schema = Joi.object({
		title: Joi.string().min(4).max(50).required(),
		description: Joi.string().min(4).max(150).required(),
		tags: Joi.array().items(Joi.string().min(1).max(50)).min(1).max(50).required(),
		body: Joi.string().min(4).max(5000).required(),
	});
	return schema.validate(user, options);
};

module.exports = {
	validateCreatingBlog,
};