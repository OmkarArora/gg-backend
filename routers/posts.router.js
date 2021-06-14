const express = require("express");
const router = express.Router();
const { authVerify } = require("../middleware/authVerify");
const { Post } = require("../models/post.model");

router.use(authVerify);

router.route("/").post(async (req, res) => {
  try {
    const post = req.body;
    const NewPost = new Post(post);
    const savedPost = await NewPost.save();
    savedPost.__v = undefined;
    res.json({ success: true, post: savedPost });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to create post",
      errorMessage: error.message,
    });
  }
});

router.param("postId", async (req, res, next, postId) => {
  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(400).json({
        success: false,
        message: "Post not found",
        errorMessage: "Post not found",
      });
    }
    req.post = post;
    next();
  } catch (error) {
    return res
      .status(400)
      .json({ success: false, message: "Error while retreiving the post" });
  }
});

router
  .route("/:postId")
  .get(async (req, res) => {
    try {
      const { post } = req;
      post.__v = undefined;
      res.json({ success: true, post });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Error while retreiving post",
        errorMessage: error.message,
      });
    }
  })
  .delete(async (req, res) => {
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
