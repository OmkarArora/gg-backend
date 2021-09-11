const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { extend } = require("lodash");

const { User } = require("../models/user.model");
const { authVerify } = require("../middleware/authVerify");
const { Post } = require("../models/post.model");
const {
  getPopulatedUserFromId,
  getPopulatedUserFromUsername,
  populateUserFeed,
} = require("../controller/user.controller");

router.route("/").get(async (req, res) => {
  try {
    const users = await User.find({}).select({ password: 0, __v: 0 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to get users",
      errorMessage: error.message,
    });
  }
});

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
      const populatedUser = await getPopulatedUserFromId(user._id, res);
      return res.json({ success: true, user: populatedUser, token });
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
      { userId: savedUser._id, email: savedUser.email },
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

router.route("/username").post(async (req, res) => {
  try {
    const { username } = req.body;
    const user = await getPopulatedUserFromUsername(username, res);
    return res.json({ success: true, user });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: "User not found",
      errorMessage: error.message,
    });
  }
});

router.route("/search").post(async (req, res) => {
  try {
    const { searchQuery } = req.body;
    if (searchQuery === "") {
      return res.status(400).json({
        success: false,
        message: "Cannot search an empty string",
        errorMessage: "Cannot search an empty string",
      });
    }
    let regex = new RegExp(searchQuery, "i");
    const searchResults = await User.find({
      $and: [{ $or: [{ name: regex }, { username: regex }] }],
    }).select({ password: 0, __v: 0 });
    res.json({ success: true, searchResults });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      errorMessage: error.message,
    });
  }
});

router.use(authVerify);

router.route("/follow").post(async (req, res) => {
  try {
    const { userId: followUserId } = req.body;
    const doesUserExist = await User.exists({ _id: followUserId });
    if (!doesUserExist) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        errorMessage: "User not found",
      });
    }
    const userId = req.user.userId;
    const user = await User.findById(userId);
    const following = user.following.map((item) => String(item));
    if (following.length >= 0 && !following.includes(followUserId)) {
      following.push(followUserId);
      user.following = following;
      await user.save();

      // Update followers for followUserId
      const followedUser = await User.findById(followUserId);
      if (!followedUser.followers.includes(user._id)) {
        followedUser.followers = [...followedUser.followers, user._id];
        let notification = { notificationType: "follow", user: user._id };
        followedUser.notifications = [
          notification,
          ...followedUser.notifications,
        ];
        await followedUser.save();
      }
    }
    const populatedUser = await getPopulatedUserFromId(user._id);
    return res.json({ success: true, user: populatedUser });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      errorMessage: error.message,
    });
  }
});

router.route("/unfollow").post(async (req, res) => {
  try {
    const { userId: unfollowUserId } = req.body;
    const doesUserExist = await User.exists({ _id: unfollowUserId });
    if (!doesUserExist) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        errorMessage: "User not found",
      });
    }
    const userId = req.user.userId;
    const user = await User.findById(userId);
    const following = user.following.filter(
      (item) => String(item) !== unfollowUserId
    );
    user.following = following;
    await user.save();

    // Update followers for followUserId
    const followedUser = await User.findById(unfollowUserId);
    const followers = followedUser.followers.filter(
      (item) => String(item) !== String(user._id)
    );
    followedUser.followers = followers;
    console.log(followedUser.followers);
    await followedUser.save();

    const populatedUser = await getPopulatedUserFromId(user._id);
    return res.json({ success: true, user: populatedUser });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      errorMessage: error.message,
    });
  }
});

const datesAreOnSameDay = (first, second) =>
  first.getFullYear() === second.getFullYear() &&
  first.getMonth() === second.getMonth() &&
  first.getDate() === second.getDate();

router.route("/feed").get(async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    const feed = [];
    if (user && user.posts && user.posts.length > 0) {
      feed.push(user.posts[0]);
      if (user.posts.length > 1) {
        for (let i = 1; i < user.posts.length; i++) {
          const post = await Post.findById(user.posts[i]);
          if (post) {
            const postDate = new Date(post.createdAt);
            if (datesAreOnSameDay(postDate, new Date())) {
              feed.push(post._id);
            }
          }
        }
      }
    }
    if (user && user.following && user.following.length > 0) {
      for (const followingUserId of user.following) {
        let followingUser = await User.findById(followingUserId).lean();
        if (followingUser.posts.length > 0) feed.push(followingUser.posts[0]);
      }
    }
    if (user) {
      user.feed = feed;
      await user.save();
    }
    const populatedUser = await populateUserFeed(user._id);
    return res.json({ success: true, feed: populatedUser.feed });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error while retreiving feed",
      errorMessage: error.message,
    });
  }
});

router.param("userId", async (req, res, next, userId) => {
  try {
    const user = await User.findById(userId).select({ __v: 0, password: 0 });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Error while retreiving the user",
        errorMessage: "Error while retreiving the user",
      });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Error while retreiving the user",
      errorMessage: error.message,
    });
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
    try {
      const { userUpdates } = req.body;
      let { user } = req;
      user = extend(user, userUpdates);
      user = await user.save();
      const populatedUser = await getPopulatedUserFromId(user._id);
      return res.json({ success: true, user: populatedUser });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error while retreiving user",
        errorMessage: error.message,
      });
    }
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

module.exports = router;
