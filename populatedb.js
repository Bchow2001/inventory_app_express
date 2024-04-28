#! /usr/bin/env node

console.log(
	'This script populates some test items and categories to your database. Specified database as argument - e.g.: node populatedb "mongodb+srv://cooluser:coolpassword@cluster0.lz91hw2.mongodb.net/local_library?retryWrites=true&w=majority"',
);

// Get arguments passed on command line
const userArgs = process.argv.slice(2);

const mongoose = require("mongoose");
const Item = require("./models/item");
const Category = require("./models/category");

const items = [];
const categories = [];

mongoose.set("strictQuery", false);

const mongoDB = userArgs[0];

main().catch((err) => console.log(err));

async function main() {
	console.log("Debug: About to connect");
	await mongoose.connect(mongoDB);
	console.log("Debug: Should be connected?");
	await createCategories();
	await createItems();
	console.log("Debug: Closing mongoose");
	mongoose.connection.close();
}

// We pass the index to the ...Create functions so that, for example,
// genre[0] will always be the Fantasy genre, regardless of the order
// in which the elements of promise.all's argument complete.
async function categoryCreate(index, cat_name, cat_desc) {
	const category = new Category({ cat_name, cat_desc });
	await category.save();
	categories[index] = category;
	console.log(`Added category: ${cat_name}`);
}

async function itemCreate(
	index,
	item_name,
	item_desc,
	item_price,
	item_stock,
	category,
) {
	const itemdetail = {
		item_name,
		item_desc,
		item_price,
		item_stock,
	};
	if (category != false) itemdetail.category = category;

	const item = new Item(itemdetail);
	await item.save();
	items[index] = item;
	console.log(`Added item: ${item_name}`);
}

async function createCategories() {
	console.log("Adding categories");
	await Promise.all([
		categoryCreate(0, "Paintings", "Artwork using paint"),
		categoryCreate(1, "Posters", "Large size prints, reproductions"),
		categoryCreate(2, "Stickers", "Small size prints with sticky surface"),
		categoryCreate(3, "Pinups", "Artwork featuring pinup design"),
		categoryCreate(4, "Hand Drawn", "Original artworks"),
		categoryCreate(5, "Digital Design", "Prints or designed digitally"),
	]);
}

async function createItems() {
	console.log("Adding Items");
	await Promise.all([
		itemCreate(
			0,
			"Greatness",
			"A collage of graffiti centred around the theme of greatness.",
			"30",
			"17",
			[categories[1], categories[5]],
		),
		itemCreate(
			1,
			"Small Folk",
			"Statuettes of workers stood beside a pillar",
			"290",
			"1",
			false,
		),
		itemCreate(
			2,
			"Mirror Decay",
			"A hybrid of a woman and fly in a state of decay in front of a mirror",
			"45",
			"70",
			[categories[1], categories[3], categories[4]],
		),
		itemCreate(
			3,
			"Bunny Sticker",
			"Sticker of a bunny human hybrid",
			"3",
			"250",
			[categories[2], categories[4]],
		),
		itemCreate(
			4,
			"Rare Stamps",
			"Collector stamps that depict scenes of battles from Waterloo",
			"900",
			"1",
			false,
		),
		itemCreate(
			5,
			"Chinese Scroll",
			"Chinese characters on a scroll",
			"50",
			"90",
			[categories[4]],
		),
	]);
}
