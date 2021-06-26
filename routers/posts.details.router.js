const express = require("express");
const router = express.Router();
const { Post } = require("../models/post.model");

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

router.route("/:postId").get(async (req, res) => {
  try {
    const { post } = req;
    res.json({ success: true, post });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Error while retreiving post",
      errorMessage: error.message,
    });
  }
});

module.exports = router;