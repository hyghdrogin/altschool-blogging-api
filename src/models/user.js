const { Schema, model }= require("mongoose");

const userSchema = new Schema({
	firstName: {
		type: String,
		lowercase: true,
		required: true
	},
	lastName: {
		type: String,
		lowercase: true,
		required: true
	},
	username: {
		type: String,
		unique: true,
		lowercase: true,
		trim: true
	},
	email: {
		type: String,
		lowercase: true,
		unique: true,
		trim: true,
		maxLength: 50,
		required: true
	},
	password: {
		type: String,
	},
	blogs: {
		type: Schema.Types.Array,
		default: {},
		ref: "Blog"
	}
}, {
	timestamps: true
}
);

module.exports = model("User", userSchema);