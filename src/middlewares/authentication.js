const models = require("../models/index.js");
const { validateUserToken } = require("../utils/jwt.js");
require("dotenv/config.js");

const verifyToken = async (req, res, next) => {
	try {
		let token;

		if (req.headers && req.headers.authorization) {
			const parts = req.headers.authorization.split(" ");
			if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
				token = parts[1];
			} else {
				return res.status(401).send({
					status: false,
					message: "Invalid authorization format"
				});
			}
		} else if (req.headers && req.headers.cookie) {
			const cookies = req.headers.cookie.split("; ");
			const tokenCookie = cookies.find(cookie => cookie.startsWith("token="));
		
			if (tokenCookie) {
				token = tokenCookie.split("=")[1];
			} else {
				return res.status(401).send({
					status: false,
					message: "Token cookie not found"
				});
			}
		}

		if (!token) {
			return res.status(403).send({
				status: false,
				message: "Authorization not found"
			});
		}

		const decoded = await validateUserToken(token);
		const user = await models.User.findById(decoded.id);

		if (!user) {
			return res.status(404).send({
				status: false,
				message: "User account not found"
			});
		}

		req.user = user;
		return next();
	} catch (error) {
		return res.status(500).send({
			status: false,
			message: error.message
		});
	}
};

module.exports = {
	verifyToken
};
