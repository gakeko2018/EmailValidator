var express = require("express");
var path = require("path");

var router = express.Router();
const fs = require("fs");
const multer = require("multer");
const verifier = require("email-verify");
const textract = require("textract");
let ultimateArray = [];
let ultimateListLength = 0;

//The  uploaded file is saved
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "./saved");
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  }
});

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

let upload = multer({ storage: storage });

//reads all files,
function copyAllFiles(req, res, savPath) {
  var filecontent = req.body.textarea1;
  fs.writeFileSync(savPath, "");
  let srcPath = path.join(__dirname, "default.txt");
  if (req.file) {
    srcPath = path.join(__dirname, "saved", req.file.filename);
  }

  textract.fromFileWithPath(srcPath, function(error, text) {
    console.log(srcPath);
    if (text != null) {
      filecontent += text;
    }
    if (filecontent == "") filecontent = "example@domain.com";
    let addressList = filecontent.split(/,|;|\s|\r|\n/);
    let addressObject = {};
    addressList.forEach(address => {
      if (address.length > 0 && !(address in [";", ",", "\n"])) {
        addressObject[address] = true;
      }
    });
    let addressArray = Object.keys(addressObject);
    ultimateListLength = addressArray.length;
    addressArray.forEach(item => {
      ultimateArray.push(item);
      verifyItem(res, item, finish);
      fs.appendFileSync(savPath, item + "\n", function(err) {
        if (err) throw err;
      });
    });
  });
}

let counter = 0;
let result = [];

const upper =
  '<!DOCTYPE html> <html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><meta http-equiv="X-UA-Compatible" content="ie=edge" /><title>Bulk Email Checker</title> <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet"/><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css"/> </head> <body> <script> document.addEventListener("DOMContentLoaded", function() { var elems = document.querySelectorAll(".collapsible"); var instances = M.Collapsible.init(elems); }); </script><script src="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js"></script> <main class="container"> <nav> <div class="nav-wrapper"><a href="/" class="brand-logo"><i class="material-icons">cloud</i>EmC</a></div> </nav><section><ul class="collapsible">';
const lower =
  '</ul> </section> </main> <script> document.addEventListener("DOMContentLoaded", function() { var elems = document.querySelectorAll(".collapsible"); var instances = M.Collapsible.init(elems); }); </script><script src="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js"></script></body></html>';
const sub1 =
  '<li> <div class="collapsible-header"> <i class="material-icons">email</i>';
const sub2 = '</div> <div class="collapsible-body">';
const sub3 = "</div> </li>";
var insertedTitle = "";
var insertedDetails = "";
const verifyCodes = verifier.verifyCodes;

function finish(res) {
  counter++;
  console.log("counter = " + counter);

  if (counter == ultimateListLength) {
    fs.appendFileSync("./views/result.html", lower);
    res.render("result.html");
  }
}
function verifyItem(res, item, callback) {
  item = item.trim();
  verifier.verify(item, function(err, info) {
    if (info.success) {
      console.log("\x1b[32m%s\x1b[0m", item + " : Verification Success");
      insertedTitle +=
        "<span style='color:green'>" +
        item +
        " : Verification Success: </span>";
    } else {
      console.log("\x1b[31m%s\x1b[0m", item + " : Verification Fail ");
      insertedTitle +=
        "<span style='color:red'>" + item + " : Verification Failed:</span>";
    }

    if (err) {
      console.log("Cannot verify '" + item + "'. Error Details:");
      console.log(err);
      insertedDetails += "Cannot verify '" + item + "'. Error Details:" + err;
      result.push([item, info.success, err]);
    } else {
      switch (info.code) {
        case verifyCodes.finishedVerification:
          result.push([item, info.success, "Verification Control Completed"]);
          console.log("Verification Control Completed"); //existing email: should respond with an object where success is true
          insertedDetails += "Verification Control Completed";
          break;
        case verifyCodes.domainNotFound:
          result.push([item, info.success, "Domain Not Found"]);
          console.log("Domain Not Found"); //non-existing domain: should respond with an object where success is false
          insertedDetails += "Domain Not Found";
          break;
        case verifyCodes.invalidEmailStructure: //badly formed email: should respond with an object where success is false
          result.push([item, info.success, "Invalid Email Structure"]);
          console.log("Invalid Email Structure");
          insertedDetails += "Invalid Email Structure";
          break;
        case verifyCodes.noMxRecords:
          result.push([item, info.success, "No MX Records"]);
          console.log("No MX Records");
          insertedDetails += "No MX Records";
          break;
        case verifyCodes.SMTPConnectionTimeout: //short timeout: should respond with an object where success is false
          result.push([item, info.success, "SMTP Connection Timeout"]);
          console.log("SMTP Connection Timeout");
          insertedDetails += "SMTP Connection Timeout";
          break;
        case verifyCodes.SMTPConnectionError:
          result.push([item, info.success, "SMTP Connection Error"]);
          console.log("SMTP Connection Error");
          insertedDetails += "SMTP Connection Error";
          break;

        default:
          result.push([item, info.success, "Unknown Response"]);
          console.log("Unknown Response");
          insertedDetails += "Unknown Response";
      }
    }

    fs.appendFileSync(
      "./views/result.html",
      sub1 + insertedTitle + sub2 + insertedDetails + sub3
    );
    insertedTitle = "";
    insertedDetails = "";

    callback(res);
  });
}

/* POST request */
router.post("/", upload.single("fileInputName"), function(req, res, next) {
  counter = 0;
  fs.writeFileSync("./views/result.html", upper);
  copyAllFiles(req, res, "./saved/thelist.txt");
});

module.exports = router;
