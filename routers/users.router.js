const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { extend } = require("lodash");

const { User } = require("../models/user.model");
const { authVerify } = require("../middleware/authVerify");

router.route("/login").post(async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email not found",
        errorMessage: "Email not found",
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (validPassword) {
      const token = jwt.sign(
        {
          userId: user._id,
          email: user.email,
        },
        process.env.JWT_SECRET
      );

      User.findById(user._id)
        .populate({
          path: "posts",
          populate: {
            path: "author",
            select: {
              _id: 1,
              profileImage: 1,
            },
          },
        })
        .exec((error, user) => {
          if (error) {
            console.error(error);
            return res.status(500).json({
              success: false,
              message: "Error while retreiving user",
              errorMessage: error.message,
            });
          }
          user.password = undefined;
          user.__v = undefined;
          return res.json({ success: true, user });
        });
    } else {
      res.status(401).json({
        success: false,
        message: "Invalid password",
        errorMessage: "Invalid password",
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "User not found",
      errorMessage: error.message,
    });
  }
});

router.route("/signup").post(async (req, res) => {
  try {
    let user = req.body;
    if (!(user.email && user.password && user.name)) {
      return res
        .status(400)
        .json({ success: false, message: "Data not formatted properly" });
    }

    const userInDB = await User.findOne({ email: user.email });
    if (userInDB) {
      return res.status(403).json({
        success: false,
        message: "Email already registered",
        errorMessage: "Email already registered",
      });
    }

    let username = user.username;
    let name = user.name;
    if (!username) {
      username =
        name.split(" ").join("") + crypto.randomBytes(3).toString("hex");
      user.username = username;
    }
    const NewUser = new User(user);

    const salt = await bcrypt.genSalt(10);

    NewUser.password = await bcrypt.hash(NewUser.password, salt);

    const savedUser = await NewUser.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET
    );

    user = savedUser;
    user.password = undefined;
    user.__v = undefined;

    res.json({
      success: true,
      user,
      token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to register user",
      errorMessage: error.message,
    });
  }
});

router.param("userId", async (req, res, next, userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Error getting user" });
    }
    req.user = user;
    next();
  } catch (error) {
    return res
      .status(400)
      .json({ success: false, message: "Error while retreiving the user" });
  }
});

router
  .route("/:userId")
  .get((req, res) => {
    try {
      const { user } = req;
      User.findById(user._id)
        .populate("posts")
        .exec((error, user) => {
          if (error) {
            console.error(error);
            return res.status(500).json({
              success: false,
              message: "Error while retreiving user",
              errorMessage: error.message,
            });
          }
          user.__v = undefined;
          user.password = undefined;
          return res.json({ success: true, user });
        });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error while retreiving user",
        errorMessage: error.message,
      });
    }
  })
  .post(async (req, res) => {
    const userUpdates = req.body;
    let { user } = req;
    user = extend(user, userUpdates);
    user = await user.save();
    user.__v = undefined;
    user.password = undefined;
    res.json({ success: true, user });
  })
  .delete(async (req, res) => {
    let { user } = req;
    user = await user.remove();
    user.password = undefined;
    user.__v = undefined;
    res.json({
      success: true,
      message: "User deleted successfully",
      user,
      deleted: true,
    });
  });

router.route("/username").post(async (req, res) => {
  try {
    const { username } = req.body;
    User.findOne({ username })
      .populate("posts")
      .exec((error, user) => {
        if (error) {
          console.error(error);
          return res.status(500).json({
            success: false,
            message: "Error while retreiving user",
            errorMessage: error.message,
          });
        }
        user.__v = undefined;
        user.password = undefined;
        return res.json({ success: true, user });
      });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: "User not found",
      errorMessage: error.message,
    });
  }
});

router.use(authVerify);
router.route("/feed").get(async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    const feed = [];
    if (user.posts.length > 0) feed.push(user.posts[0]);
    if (user.following && user.following.length > 0) {
      user.following.forEach((followingUserId) => {
        (async () => {
          let followingUser = await User.findById(followingUserId);
          if (followingUser.posts.length > 0) feed.push(followingUser.posts[0]);
        })();
      });
    }
    user.feed = feed;
    await user.save();
    User.findById(user._id)
      .populate("feed")
      .exec((error, user) => {
        if (error) {
          console.error(error);
          return res.status(500).json({
            success: false,
            message: "Error while retreiving feed",
            errorMessage: error.message,
          });
        }
        return res.json({ success: true, feed: user.feed });
      });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error while retreiving feed",
      errorMessage: error.message,
    });
  }
});

module.exports = router;
