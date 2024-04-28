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

exports.category_list = asyncHandler(async (req, res, next) => {
	const allCategories = await Category.find().sort({ cat_name: 1 }).exec();

	res.render("category_list", {
		title: "Categories in Inventory",
		category_list: allCategories,
	});
});

exports.category_detail = asyncHandler(async (req, res, next) => {
	const [category, itemsInCategory] = await Promise.all([
		Category.findById(req.params.id).exec(),
		Item.find({ category: req.params.id }, "item_name item_desc").exec(),
	]);

	res.render("category_detail", {
		title: "Category Detail",
		category,
		item_list: itemsInCategory,
	});
});

exports.category_create_get = (req, res, next) => {
	res.render("category_form", {
		title: "Create Category",
		category: null,
		errors: null,
	});
};

exports.category_create_post = [
	// Validation and Sanitization
	body("cat_name", "Name must be at least 3 characters.")
		.trim()
		.isLength({ min: 3 })
		.escape(),
	body("cat_desc", "Description must not be empty")
		.trim()
		.isLength({ min: 1 })
		.escape(),

	asyncHandler(async (req, res, next) => {
		const errors = validationResult(req);

		// Create a new Category object with clean data
		const category = new Category({
			cat_name: req.body.cat_name,
			cat_desc: req.body.cat_desc,
		});

		// Check if errors are empty
		if (!errors.isEmpty()) {
			// There are errors, Render form again with sanitized values
			res.render("category_form", {
				title: "Create Category",
				category,
				errors: errors.array(),
			});
		} else {
			// Data from form is valid.
			// Check if item with same name already exists.
			const catExists = await Category.findOne({
				cat_name: req.body.cat_name,
			})
				.collation({ locale: "en", strength: 2 })
				.exec();
			if (catExists) {
				res.redirect(catExists.url);
			} else {
				// Upload multer buffer to cloudinary if image is selected
				if (req.file) {
					const uploadFromBuffer = () =>
						new Promise((resolve, reject) => {
							const cld_upload_stream =
								cloudinary.uploader.upload_stream(
									{
										public_id: `${
											req.body.cat_name
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
					const cat_img_url = result.url;

					// Set cat_img_url to category
					category.cat_img_url = cat_img_url;
				}
				await category.save();
				res.redirect(category.url);
			}
		}
	}),
];

exports.category_delete_get = asyncHandler(async (req, res, next) => {
	const [category, item_list] = await Promise.all([
		Category.findById(req.params.id).exec(),
		Item.find({ category: req.params.id }).exec(),
	]);

	if (category === null) {
		res.redirect("/inventory/categories");
	}

	res.render("category_delete", {
		title: "Delete Category",
		category,
		item_list,
		incorrect: null,
	});
});

exports.category_delete_post = asyncHandler(async (req, res, next) => {
	if (req.body.password === "Adminuser") {
		await Category.findByIdAndDelete(req.body.catid);
		res.redirect("/inventory/categories");
	} else {
		const [category, item_list] = await Promise.all([
			Category.findById(req.params.id).exec(),
			Item.find({ category: req.params.id }).exec(),
		]);

		if (category === null) {
			res.redirect("/inventory/categories");
		}

		res.render("category_delete", {
			title: "Delete Category",
			category,
			item_list,
			incorrect: true,
		});
	}
});

exports.category_update_get = asyncHandler(async (req, res, next) => {
	const category = await Category.findById(req.params.id);

	if (category === null) {
		// No results.
		const err = new Error("Category not found");
		err.status = 404;
		return next(err);
	}

	res.render("category_form", {
		title: "Update Category",
		category,
		errors: null,
	});
});

exports.category_update_post = [
	// Validation and Sanitization
	body("cat_name", "Name must be at least 3 characters.")
		.trim()
		.isLength({ min: 3 })
		.escape(),
	body("cat_desc", "Description must not be empty")
		.trim()
		.isLength({ min: 1 })
		.escape(),

	asyncHandler(async (req, res, next) => {
		const errors = validationResult(req);
		// Create a new Category object with clean data
		const category = new Category({
			cat_name: req.body.cat_name,
			cat_desc: req.body.cat_desc,
			_id: req.params.id,
		});

		// Check if errors are empty
		if (!errors.isEmpty()) {
			// There are errors, Render form again with sanitized values
			res.render("category_form", {
				title: "Update Category",
				category,
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
										req.body.cat_name
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
				const cat_img_url = result.url;

				// Set cat_img_url to category
				category.cat_img_url = cat_img_url;
			} else {
				// Keep old img_url if no new file has been selected
				const oldCat = await Category.findById(req.params.id);
				const { cat_img_url } = oldCat;
				category.cat_img_url = cat_img_url;
			}
			const updatedCategory = await Category.findByIdAndUpdate(
				req.params.id,
				category,
				{},
			);
			res.redirect(updatedCategory.url);
		}
	}),
];
