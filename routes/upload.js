var express = require("express");
var router = express.Router();
const fs = require("fs");
const verifier = require("email-verify");
const textract = require("textract");
const fileUpload = require("express-fileupload");

let ultimateArray = [];
let ultimateListLength = 0;
let uploadedFile;
router.use(fileUpload());

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

let counter = 0;
let result = [];
//reads all files,
function copyAllFiles(req, res, savPath) {
  var filecontent = req.body.textarea1;
  fs.writeFileSync(savPath, "");
  let srcPath = uploadedFile;

  textract.fromFileWithPath(srcPath, function(error, text) {
    if (text == null || text === "undefined" || text == "") {
      if (filecontent == "") filecontent = "example@domain.com";
    } else filecontent += "\n" + text;
    let addressList = filecontent.split(/,|;|\s|\r|\n/);
    let addressObject = {};
    addressList.forEach(address => {
      if (
        address.length > 0 &&
        address != ";" &&
        address != "," &&
        address != "\n"
      ) {
        addressObject[address] = true;
      }
    });
    let addressArray = Object.keys(addressObject);
    ultimateListLength = addressArray.length;
    addressArray.forEach(item => {
      ultimateArray.push(item);
      verifyItem(req, res, item, finish);
      fs.appendFileSync(savPath, item + "\n", function(err) {
        if (err) throw err;
      });
    });
  });
}

const upper =
  '<!DOCTYPE html> <html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><meta http-equiv="X-UA-Compatible" content="ie=edge" /><title>Bulk Email Checker</title> <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet"/><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css"/> </head> <body> <script> document.addEventListener("DOMContentLoaded", function() { var elems = document.querySelectorAll(".collapsible"); var instances = M.Collapsible.init(elems); }); </script><script src="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js"></script> <main class="container"> <nav> <div class="nav-wrapper"><a href="/" class="brand-logo"><i class="material-icons">cloud</i>EmC</a></div> </nav><section><div class="container" style="text-align:center"><a href="results.json"> Click here to save the results as JSON. </a></div><ul class="collapsible">';
const lower =
  '</ul> </section> </main> <script> document.addEventListener("DOMContentLoaded", function() { var elems = document.querySelectorAll(".collapsible"); var instances = M.Collapsible.init(elems); }); </script><script src="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js"></script></body></html>';
const sub1 =
  '<li> <div class="collapsible-header"> <i class="material-icons">email</i>';
const sub2 = '</div> <div class="collapsible-body">';
const sub3 = "</div> </li>";
let insertedTitle = "";
let insertedDetails = "";
const verifyCodes = verifier.verifyCodes;

function finish(req, res) {
  counter++;
  console.log("counter = " + counter);

  if (counter == ultimateListLength) {
    fs.appendFileSync("./views/result.ejs", lower);
    fs.writeFileSync("./public/results.json", JSON.stringify({ ...result }));
    fs.unlinkSync(uploadedFile);
    res.render("result");
    //res.send({...result});
  }
}
function verifyItem(req, res, item, callback) {
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
      "./views/result.ejs",
      sub1 + insertedTitle + sub2 + insertedDetails + sub3
    );
    insertedTitle = "";
    insertedDetails = "";

    callback(req, res);
  });
}

/* POST request */
router.post("/", function(req, res, next) {
  counter = 0;
  fs.writeFileSync("default.txt");

  if (Object.keys(req.files).length == 0) {
    uploadedFile = "default.txt";
  } else {
    let myFile = req.files.fileInputName;
    uploadedFile = req.files.fileInputName.name;
    myFile.mv(uploadedFile, function(err) {
      if (err) return res.status(500).send(err);
    });
  }

  fs.writeFileSync("./views/result.ejs", upper);
  copyAllFiles(req, res, "theList.txt");
});

module.exports = router;
