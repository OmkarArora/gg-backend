const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    sucess: false,
    message: "An error occurred",
  });
};

module.exports = { errorHandler };