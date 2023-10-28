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

const validateUserSignup = (user) => {
	const schema = Joi.object({
		firstName: Joi.string().min(4).max(50).required(),
		lastName: Joi.string().min(4).max(50).required(),
		email: Joi.string().email().min(4).max(50).required(),
		username: Joi.string().min(4).max(50).required(),
		password: Joi.string().min(4).required(),
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
	validateUserSignup, validateUserLogin
};