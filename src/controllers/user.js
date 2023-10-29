const { validateUserLogin, validateUserSignup } = require("../validations/user.js");
const bcrypt = require("bcrypt");
const models = require("../models");
const { generateToken } = require("../utils/jwt.js");
const logger = require("../utils/logger.js");

const userRegistration = async (req, res) => {
	try {
		const { error, value } = validateUserSignup(req.body);
		if(error) {
			return res.status(400).send({
				status: false,
				message: error.message
			});
		}
		const existingUser = await models.User.findOne({
			$or: [{
				email: value.email
			}, {
				username: value.username
			}]
		});
		if(existingUser) {
			return res.status(409).send({
				status: false,
				message: "User already exist"
			});
		}
		const saltRound = Math.floor(Math.random() * 10);
		const salt = await bcrypt.genSalt(saltRound);
		const hashedPassword = await bcrypt.hash(value.password, salt);
		await models.User.create({
			firstName: value.firstName,
			lastName: value.lastName,
			username: value.username,
			email: value.email,
			password: hashedPassword
		});

		return res.status(201).render("login");
	} catch (error) {
		logger.error(`Error signing up user: ${error.message}`);
		return res.status(500).send({
			status: false,
			message: "Internal server error"
		});
	}
};

const userLogin = async (req, res) => {
	try {
		const { error, value } = validateUserLogin(req.body);
		if(error) {
			return res.status(400).send({
				status: false,
				message: error.message
			});
		}
		const existingUser = await models.User.findOne({
			$or: [{
				email: value.emailUsername
			}, {
				username: value.emailUsername
			}]
		});
		if(!existingUser) {
			return res.status(404).send({
				status: false,
				message: "Invalid credentials"
			});
		}
		const passwordCompare = await bcrypt.compare(value.password, existingUser.password);
		if(!passwordCompare) {
			return res.status(404).send({
				status: false,
				message: "Invalid credentials"
			});
		}
		const token = await generateToken({ id: existingUser.id, username: existingUser.username, email: existingUser.email });
		const user = await models.User.findOne({ email: existingUser.email }).select("-password");
		res.cookie("token", token, { httpOnly: true });
		return res.status(200).render("dashboard", ({
			user, token
		}));
	} catch (error) {
		logger.error(`Error logging in user: ${error.message}`);
		return res.status(500).send({
			status: false,
			message: "Internal server error"
		});
	}
};

const viewUser = async(req, res) => {
	const { userId } = req.params;

	try {
		const user = await models.User.findById({ userId });

		if (!user) {
			return res.status(404).json({
				status: false,
				message: "User not found"
			});
		}

		return res.status(200).render("viewProfile", {
			userId, user
		});
	} catch (error) {
		logger.error(`Error logging in user: ${error.message}`);
		return res.status(500).send({
			status: false,
			message: "Internal server error"
		});
	}
};

const logOut = async (req, res) => {
	try {
		res.clearCookie("token");
		return res.status(440).render("login");
	} catch (error) {
		logger.error(`Error logging out: ${error.message}`);
		return res.status(500).send({
			status: false,
			message: "Internal server error"
		});
	}
};

module.exports = {
	userRegistration, userLogin, viewUser, logOut
};