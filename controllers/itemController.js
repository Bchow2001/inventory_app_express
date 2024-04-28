const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");

// Set up cloudinary connection
const cloudinary = require("cloudinary").v2;

cloudinary.config({
	cloud_name: "dtlihhzbp",
	api_key: "335874551118595",
	api_secret: "T0HOzWU7nwpKFzqt9jFbIBUSOP4",
});
const streamifier = require("streamifier");

const Item = require("../models/item");
const Category = require("../models/category");

exports.index = asyncHandler(async (req, res, next) => {
	const [item_count, item_total_doc, category_count] = await Promise.all([
		Item.countDocuments({}).exec(),
		Item.aggregate([
			{
				$group: {
					_id: null,
					item_total: { $sum: "$item_stock" },
				},
			},
		]),
		Category.countDocuments({}).exec(),
	]);

	item_total = item_total_doc[0].item_total;

	res.render("index", {
		title: "Inventory Home",
		item_count,
		item_total,
		category_count,
	});
});

exports.item_list = asyncHandler(async (req, res, next) => {
	const allItems = await Item.find(
		{},
		"item_name item_desc category item_img_url",
	)
		.sort({ item_name: 1 })
		.populate("category")
		.exec();

	res.render("item_list", {
		title: "Items in Inventory",
		item_list: allItems,
	});
});

exports.item_detail = asyncHandler(async (req, res, next) => {
	const item = await Item.findById(req.params.id).populate("category").exec();

	if (item === null) {
		const err = new Error("Item not found.");
		err.status = 404;
		return next(err);
	}
	res.render("item_detail", {
		title: item.item_name,
		item,
	});
});

exports.item_create_get = asyncHandler(async (req, res, next) => {
	const categories = await Category.find({}, "cat_name")
		.sort({ cat_name: 1 })
		.exec();

	res.render("item_form", {
		title: "Create Item",
		categories,
		item: null,
		errors: null,
	});
});

exports.item_create_post = [
	// Convert categories selected to an array
	(req, res, next) => {
		if (!Array.isArray(req.body.category)) {
			req.body.category =
				typeof req.body.category === "undefined"
					? []
					: [req.body.category];
		}
		next();
	},

	// Validation and Sanitization
	body("item_name", "Name must be at least 3 characters.")
		.trim()
		.isLength({ min: 3 })
		.escape(),
	body("item_desc", "Description must not be empty")
		.trim()
		.isLength({ min: 1 })
		.escape(),
	body("item_price")
		.trim()
		.isFloat({ min: 0 })
		.withMessage("Price must be positive")
		.escape(),
	body("item_stock")
		.trim()
		.isFloat({ min: 0 })
		.withMessage("Stock must be positive")
		.escape(),
	body("category.*").escape(),

	// Process request after validation and sanitization
	asyncHandler(async (req, res, next) => {
		// Extract the validation errors from a request.
		const errors = validationResult(req);

		// Create a Item object with escaped and trimmed data
		const item = new Item({
			item_name: req.body.item_name,
			item_desc: req.body.item_desc,
			item_price: req.body.item_price,
			item_stock: req.body.item_stock,
			category: req.body.category,
		});

		// Check if errors are empty
		if (!errors.isEmpty()) {
			// There are errors, Render form again with sanitized values and error messages

			// Get all categories to re-render form
			const allCategories = await Category.find()
				.sort({ cat_name: 1 })
				.exec();

			// Mark previously selected categories as checked
			allCategories.forEach((category) => {
				if (item.category.includes(category._id)) {
					Object.defineProperty(category, "checked", {
						value: true,
					});
				}
			});

			res.render("item_form", {
				title: "Create Item",
				categories: allCategories,
				item,
				errors: errors.array(),
			});
		} else {
			// Data from form is valid.
			// Check if item with same name already exists.
			const itemExists = await Item.findOne({
				item_name: req.body.item_name,
			})
				.collation({ locale: "en", strength: 2 })
				.exec();
			if (itemExists) {
				res.redirect(itemExists.url);
			} else {
				// Upload multer buffer to cloudinary if image is selected
				if (req.file) {
					const uploadFromBuffer = () =>
						new Promise((resolve, reject) => {
							const cld_upload_stream =
								cloudinary.uploader.upload_stream(
									{
										public_id: `${
											req.body.item_name
										} + - + ${Date.now()}`,
									},
									(error, result) => {
										if (result) {
											resolve(result);
										} else {
											reject(error);
										}
									},
								);
							streamifier
								.createReadStream(req.file.buffer)
								.pipe(cld_upload_stream);
						});
					const result = await uploadFromBuffer(req);
					const item_img_url = result.url;

					// Set item_img_url to item
					item.item_img_url = item_img_url;
				}
				await item.save();
				res.redirect(item.url);
			}
		}
	}),
];

exports.item_delete_get = asyncHandler(async (req, res, next) => {
	const item = await Item.findById(req.params.id).populate("category").exec();

	if (item === null) {
		res.redirect("/inventory/items");
	}

	res.render("item_delete", {
		title: "Delete Item",
		item,
		incorrect: null,
	});
});

exports.item_delete_post = asyncHandler(async (req, res, next) => {
	if (req.body.password === "Adminuser") {
		await Item.findByIdAndDelete(req.body.itemid);
		res.redirect("/inventory/items");
	} else {
		const item = await Item.findById(req.params.id)
			.populate("category")
			.exec();

		if (item === null) {
			res.redirect("/inventory/items");
		}

		res.render("item_delete", {
			title: "Delete Item",
			item,
			incorrect: true,
		});
	}
});

exports.item_update_get = asyncHandler(async (req, res, next) => {
	const [item, categories] = await Promise.all([
		Item.findById(req.params.id),
		Category.find({}, "cat_name").sort({ cat_name: 1 }).exec(),
	]);

	if (item === null) {
		// No results.
		const err = new Error("Item not found");
		err.status = 404;
		return next(err);
	}

	// Mark selected categories as checked
	categories.forEach((category) => {
		if (item.category.includes(category._id)) category.checked = "true";
	});

	res.render("item_form", {
		title: "Update Item",
		item,
		categories,
		errors: null,
	});
});

exports.item_update_post = [
	// Convert categories selected to an array
	(req, res, next) => {
		if (!Array.isArray(req.body.category)) {
			req.body.category =
				typeof req.body.category === "undefined"
					? []
					: [req.body.category];
		}
		next();
	},

	// Validation and Sanitization
	body("item_name", "Name must be at least 3 characters.")
		.trim()
		.isLength({ min: 3 })
		.escape(),
	body("item_desc", "Description must not be empty")
		.trim()
		.isLength({ min: 1 })
		.escape(),
	body("item_price")
		.trim()
		.isFloat({ min: 0 })
		.withMessage("Price must be positive")
		.escape(),
	body("item_stock")
		.trim()
		.isFloat({ min: 0 })
		.withMessage("Stock must be positive")
		.escape(),
	body("category.*").escape(),

	// Process request after validation and sanitization
	asyncHandler(async (req, res, next) => {
		// Extract the validation errors from a request.
		const errors = validationResult(req);

		// Create a Item object with escaped and trimmed data
		const item = new Item({
			item_name: req.body.item_name,
			item_desc: req.body.item_desc,
			item_price: req.body.item_price,
			item_stock: req.body.item_stock,
			category:
				typeof req.body.category === "undefined"
					? []
					: req.body.category,
			_id: req.params.id,
		});

		// Check if errors are empty
		if (!errors.isEmpty()) {
			// There are errors, Render form again with sanitized values and error messages

			// Get all categories to re-render form
			const allCategories = await Category.find()
				.sort({ cat_name: 1 })
				.exec();

			// Mark previously selected categories as checked
			allCategories.forEach((category) => {
				if (item.category.includes(category._id)) {
					Object.defineProperty(category, "checked", {
						value: true,
					});
				}
			});

			res.render("item_form", {
				title: "Create Item",
				categories: allCategories,
				item,
				errors: errors.array(),
			});
		} else {
			// Upload multer buffer to cloudinary if image is selected
			if (req.file) {
				const uploadFromBuffer = () =>
					new Promise((resolve, reject) => {
						const cld_upload_stream =
							cloudinary.uploader.upload_stream(
								{
									public_id: `${
										req.body.item_name
									} + - + ${Date.now()}`,
								},
								(error, result) => {
									if (result) {
										resolve(result);
									} else {
										reject(error);
									}
								},
							);
						streamifier
							.createReadStream(req.file.buffer)
							.pipe(cld_upload_stream);
					});
				const result = await uploadFromBuffer(req);
				const item_img_url = result.url;

				// Set item_img_url to item
				item.item_img_url = item_img_url;
			} else {
				// Keeping old img_url if no new file has been selected
				const oldItem = await Item.findById(req.params.id);
				const { item_img_url } = oldItem;
				item.item_img_url = item_img_url;
			}
			const updatedItem = await Item.findByIdAndUpdate(
				req.params.id,
				item,
				{},
			);
			res.redirect(updatedItem.url);
		}
	}),
];
