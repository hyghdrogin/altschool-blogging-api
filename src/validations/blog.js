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
		description: Joi.string().min(4).max(100).required(),
		tags: Joi.array().min(4).max(50).required(),
		body: Joi.string().min(4).max(50).required(),
	});
	return schema.validate(user, options);
};

const validateUserLogin = (user) => {
	const schema = Joi.object({
		emailUsername: Joi.string().min(4).max(50).required(),
		password: Joi.string().min(4).required(),
	});
	return schema.validate(user, options);
};

module.exports = {
	validateCreatingBlog, validateUserLogin
};