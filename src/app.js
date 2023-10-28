const db = require("./database/index.js");
const createServer = require("./utils/server.js");
require("dotenv").config();

const app = createServer();
const port = process.env.PORT || 5000;

app.listen(port, async() => {
	await db.connect();
	console.info(`Server is running on port: ${port}`);
});

module.exports = { app };