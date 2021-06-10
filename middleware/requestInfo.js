const requestInfo = (req, res, next) => {
  console.log("\nREQUEST", req.path);
  console.log("METHOD", req.method);
  next();
};

module.exports = { requestInfo };
