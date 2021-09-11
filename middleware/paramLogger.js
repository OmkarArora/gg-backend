const paramLogger = (req, res, next) => {
  if (req.params) {
    console.log("\nPARAMS");
    console.table(req.params);
    req.paramsChecked = true;
  } else {
    req.paramsChecked = false;
  }
  next();
};

module.exports = { paramLogger };
