var express = require("express");
var router = express.Router();
const rimraf = require("rimraf");

/* GET home page. */
router.get("/", function(req, res, next) {
  rimraf("./saved/*", function() {
    console.log("Saved folder cleared.");
  });

  res.render("index", { title: "Express" });
});

module.exports = router;
