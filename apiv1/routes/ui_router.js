"use strict";
const express = require("express");
const ui_router = express.Router();
const path = require("path");

ui_router.get("/*", (req, res) => {
  res.sendFile(
    path.join(
      __dirname + "./../../webclient/index.html"
    )
  );
});

module.exports = ui_router;
