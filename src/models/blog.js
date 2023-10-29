const { Schema, model }= require("mongoose");

const blogSchema = new Schema({
	title: {
		type: String,
		lowercase: true,
		required: true
	},
	description: {
		type: String,
		lowercase: true,
		required: true
	},
	author: {
		type: Schema.Types.ObjectId,
		ref: "User",
		required: true
	},
	state: {
		type: String,
		enum: ["draft", "published", "deleted"],
		default: "draft",
	},
	readCount: {
		type: Number,
		default: 0
	},
	readingTime: {
		type: String
	},
	tags: {
		type: [String]
	},
	body: {
		type: String,
		required: true,
	},
	deleted: {
		type: Boolean,
		default: false
	}
}, {
	timestamps: true
}
);

module.exports = model("Blog", blogSchema);