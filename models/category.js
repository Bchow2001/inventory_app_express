const mongoose = require("mongoose");

const { Schema } = mongoose;

const CategorySchema = new Schema({
	cat_name: { type: String, required: true, maxLength: 100 },
	cat_desc: { type: String, required: true, maxLength: 200 },
	cat_img_url: { type: String },
});

// Virtual for item's URL
CategorySchema.virtual("url").get(function () {
	return `/inventory/category/${this._id}`;
});

module.exports = mongoose.model("Category", CategorySchema);
