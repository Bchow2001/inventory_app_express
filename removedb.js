const userArgs = process.argv.slice(2);

const mongoose = require("mongoose");

mongoose.set("strictQuery", false);

const mongoDB = userArgs[0];

main().catch((err) => console.log(err));

async function main() {
	console.log("Debug: About to connect");
	await mongoose.connect(mongoDB);
	console.log("Debug: Should be connected");
	await mongoose.connection.db.dropDatabase();
	console.log("Debug: db should be dropped");
}
