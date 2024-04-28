const mongoose = require("mongoose");

const { Schema } = mongoose;

const ItemSchema = new Schema({
	item_name: { type: String, required: true, maxLength: 100 },
	item_desc: { type: String, required: true, maxLength: 200 },
	item_price: { type: Number, required: true, min: 0 },
	item_stock: { type: Number, required: true, min: 0 },
	category: [{ type: Schema.Types.ObjectId, ref: "Category" }],
	item_img_url: { type: String },
});

// Virtual for item's URL
ItemSchema.virtual("url").get(function () {
	return `/inventory/item/${this._id}`;
});

module.exports = mongoose.model("Item", ItemSchema);
