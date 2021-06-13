const jwt = require("jsonwebtoken");

const authVerify = (req, res, next) => {
  const token = req.headers.authorization;
  console.log("token received", token);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userAuth = { userId: decoded.userId, email: decoded.email };
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Unauthorised access, put valid token",
    });
  }
};


module.exports = { authVerify };