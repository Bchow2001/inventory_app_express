const express = require("express");

const router = express.Router();

// Set up multer for file uploads (Multer is a middleware function)
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Require controller modules
const itemController = require("../controllers/itemController");
const categoryController = require("../controllers/categoryController");

// ITEM ROUTES

// GET index home page
router.get("/", itemController.index);

// GET request for creating a Item. NOTE This must come before routes that display Item (uses id).
router.get("/item/create", itemController.item_create_get);

// POST request for creating Item.
router.post(
	"/item/create",
	upload.single("item_img_url"),
	itemController.item_create_post,
);

// GET request to delete Item.
router.get("/item/:id/delete", itemController.item_delete_get);

// POST request to delete Item.
router.post("/item/:id/delete", itemController.item_delete_post);

// GET request to update Item.
router.get("/item/:id/update", itemController.item_update_get);

// POST request to update Item.
router.post(
	"/item/:id/update",
	upload.single("item_img_url"),
	itemController.item_update_post,
);

// GET request for one Item.
router.get("/item/:id", itemController.item_detail);

// GET request for list of all Item items.
router.get("/items", itemController.item_list);

// CATEGORY LIST

// GET request for creating a Category. NOTE This must come before routes that display Category (uses id).
router.get("/category/create", categoryController.category_create_get);

// POST request for creating Category.
router.post(
	"/category/create",
	upload.single("cat_img_url"),
	categoryController.category_create_post,
);

// GET request to delete Category.
router.get("/category/:id/delete", categoryController.category_delete_get);

// POST request to delete Category.
router.post("/category/:id/delete", categoryController.category_delete_post);

// GET request to update Category.
router.get("/category/:id/update", categoryController.category_update_get);

// POST request to update Category.
router.post(
	"/category/:id/update",
	upload.single("cat_img_url"),
	categoryController.category_update_post,
);

// GET request for one Category.
router.get("/category/:id", categoryController.category_detail);

// GET request for list of all Category items.
router.get("/categories", categoryController.category_list);

module.exports = router;
