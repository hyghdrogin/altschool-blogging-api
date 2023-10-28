const mongoose = require("mongoose");
require("dotenv/config");

const connect = async () => {
	const connection = await mongoose.connect(process.env.DATABASE_URL);
	if (!connection) {
		console.log("DATABASE connection failed! Exiting Now");
		process.emit("SIGTERM");
		process.exit(1);
	}
	console.log("DATABASE connected successfully!");
	return connection;
};

module.exports = { connect };