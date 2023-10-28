const jwt = require("jsonwebtoken");
require("dotenv").config();

const secret = process.env.JWT_KEY;

const generateToken = async(payload) => {
	const token = jwt.sign(payload, secret, { expiresIn: "1h" });
	return token;
};

const validateUserToken = async (token) => {
	try {
		const key = process.env.JWT_KEY || "secret";
		const data = jwt.verify(token, key);
		if (!data) return;

		return data;
	} catch (e) {
		console.error(e);
	}
};

module.exports = {
	generateToken, validateUserToken
};