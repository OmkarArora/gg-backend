const { User } = require("../models/user.model");

const userPopulationFields = {
  _id: 1,
  profileImage: 1,
  name: 1,
  username: 1,
  email: 1,
  bannerImage: 1,
};

const getPopulatedUserFromId = async (userId, res) => {
  try {
    const user = await User.findById(userId)
      .populate({
        path: "posts",
        populate: {
          path: "author",
          select: {
            ...userPopulationFields,
          },
        },
      })
      .populate({
        path: "feed",
        select: { __v: 0 },
        populate: {
          path: "author",
          select: {
            ...userPopulationFields,
          },
        },
      })
      .populate({
        path: "notifications",
        populate: {
          path: "user",
          select: {
            ...userPopulationFields,
          },
        },
      });
    user.__v = undefined;
    user.password = undefined;
    return user;
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Error while retreiving user",
      errorMessage: error.message,
    });
  }
};

const getPopulatedUserFromUsername = async (username, res) => {
  try {
    const user = await User.findOne({ username })
      .populate({
        path: "posts",
        populate: {
          path: "author",
          select: { ...userPopulationFields },
        },
      })
      .populate({
        path: "feed",
        select: { __v: 0 },
        populate: {
          path: "author",
          select: {
            ...userPopulationFields,
          },
        },
      })
      .populate({
        path: "notifications",
        populate: {
          path: "user",
          select: {
            ...userPopulationFields,
          },
        },
      });
    user.__v = undefined;
    user.password = undefined;
    return user;
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Error while retreiving user",
      errorMessage: error.message,
    });
  }
};

module.exports = { getPopulatedUserFromId, getPopulatedUserFromUsername };
