const express = require("express");
const router = express.Router();
const { authVerify } = require("../middleware/authVerify");
const { Post } = require("../models/post.model");
const { User } = require("../models/user.model");

router.use(authVerify);

router.route("/").post(async (req, res) => {
  try {
    const post = req.body;
    const NewPost = new Post(post);
    const savedPost = await NewPost.save();
    savedPost.__v = undefined;

    // Save post in user
    let user = req.user;
    let userInDB = await User.findById(user.userId);
    userInDB.posts.unshift(savedPost._id);
    await userInDB.save();

    Post.findById(savedPost._id)
      .populate({
        path: "author",
        select: { _id: 1, username: 1, name: 1, profileImage: 1 },
      })
      .exec((error, post) => {
        if (error) {
          console.error(error);
          return res.status(500).json({
            success: false,
            message: "Error while retreiving post",
            errorMessage: error.message,
          });
        }
        post.__v = undefined;
        return res.json({ success: true, post });
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to create post",
      errorMessage: error.message,
    });
  }
});

router.route("/like").post(async (req, res) => {
  try {
    const { postId } = req.body;
    const userId = req.user.userId;
    const post = await Post.findById(postId);
    const likes = post.likes.map((item) => String(item));

    if (likes.length >= 0 && !likes.includes(userId)) {
      likes.push(userId);
      post.likes = likes;
      await post.save();
    }
    Post.findById(post._id)
      .populate({
        path: "author",
        select: {
          _id: 1,
          profileImage: 1,
          name: 1,
          username: 1,
          email: 1,
          bannerImage: 1,
        },
      })
      .exec((error, post) => {
        if (error) {
          console.error(error);
          return res.status(500).json({
            success: false,
            message: "Error while retreiving post",
            errorMessage: error.message,
          });
        }
        post.__v = undefined;
        return res.json({ success: true, post });
      });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      errorMessage: error.message,
    });
  }
});

router.route("/unlike").post(async (req, res) => {
  try {
    const { postId } = req.body;
    const userId = req.user.userId;
    const post = await Post.findById(postId);
    const likes = post.likes.filter((item) => String(item) !== userId);
    post.likes = likes;
    await post.save();
    
    Post.findById(post._id)
      .populate({
        path: "author",
        select: {
          _id: 1,
          profileImage: 1,
          name: 1,
          username: 1,
          email: 1,
          bannerImage: 1,
        },
      })
      .exec((error, post) => {
        if (error) {
          console.error(error);
          return res.status(500).json({
            success: false,
            message: "Error while retreiving post",
            errorMessage: error.message,
          });
        }
        post.__v = undefined;
        return res.json({ success: true, post });
      });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      errorMessage: error.message,
    });
  }
});

router.param("postId", async (req, res, next, postId) => {
  try {
    Post.findById(postId)
      .populate({
        path: "author",
        select: { __v: 0, password: 0 },
      })
      .exec((error, post) => {
        if (error) {
          console.error(error);
          return res.status(500).json({
            success: false,
            message: "Error while retreiving post",
            errorMessage: error.message,
          });
        }
        if (post) {
          post.__v = undefined;
          req.post = post;
          next();
        } else {
          return res.status(404).json({
            success: false,
            message: "Post not found",
            errorMessage: "Post not found",
          });
        }
      });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Error while retreiving the post",
      errorMessage: "Error while retreiving the post",
    });
  }
});

router.route("/:postId").delete(async (req, res) => {
  try {
    let { post } = req;
    post = await post.remove();
    post.__v = undefined;
    res.json({
      success: true,
      message: "Post deleted successfully",
      post,
      deleted: true,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Error while deleting post",
      errorMessage: error.message,
    });
  }
});

module.exports = router;
