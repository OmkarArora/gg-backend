const mongoose = require("mongoose");
require("mongoose-type-url");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: "Cannot create a user without a `name`",
    },
    email: {
      type: String,
      required: "Email address is required",
      unique: true,
      index: true,
      validate: [
        (email) => {
          let re = new RegExp(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/);
          return re.test(email);
        },
        "Provide a valid email address",
      ],
    },
    password: {
      type: String,
      required: true,
      minLength: [8, "Password must be atleast 8 characters long"],
    },
    username: {
      type: String,
      required: "Username is a required feild",
      unique: true,
      index: true,
      validate: [
        (username) => !username.includes(" "),
        "Provide a valid username",
      ],
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    profileImage: mongoose.SchemaTypes.Url,
    bannerImage: mongoose.SchemaTypes.Url,
    birthDate: Date,
    bio: {
      type: String,
      maxLength: 160,
    },
    location: String,
    website: mongoose.SchemaTypes.Url,
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    feed: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ]
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", UserSchema);
module.exports = { User };
