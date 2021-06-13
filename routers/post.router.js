const express = require("express");
const router = express.Router();

const { authVerify } = require("../middleware/authVerify");

router.use(authVerify);

