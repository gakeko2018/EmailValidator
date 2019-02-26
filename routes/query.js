const express = require("express");
const router = express.Router();
const verifier = require("email-verify");
let result = [];
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

const verifyCodes = verifier.verifyCodes;

function verifyItem(res, req) {
  item = req.query.email.trim();
  verifier.verify(item, function(err, info) {
    if (info.success) {
      console.log("\x1b[32m%s\x1b[0m", item + " : Verification Success");
    } else {
      console.log("\x1b[31m%s\x1b[0m", item + " : Verification Fail ");
    }

    if (err) {
      console.log("Cannot verify '" + item + "'. Error Details:");
      console.log(err);
      result.push([item, info.success, err]);
    } else {
      switch (info.code) {
        case verifyCodes.finishedVerification:
          result.push([item, info.success, "Verification Control Completed"]);
          console.log("Verification Control Completed"); //existing email: should respond with an object where success is true
          break;
        case verifyCodes.domainNotFound:
          result.push([item, info.success, "Domain Not Found"]);
          console.log("Domain Not Found"); //non-existing domain: should respond with an object where success is false
          break;
        case verifyCodes.invalidEmailStructure: //badly formed email: should respond with an object where success is false
          result.push([item, info.success, "Invalid Email Structure"]);
          console.log("Invalid Email Structure");
          break;
        case verifyCodes.noMxRecords:
          result.push([item, info.success, "No MX Records"]);
          console.log("No MX Records");
          break;
        case verifyCodes.SMTPConnectionTimeout: //short timeout: should respond with an object where success is false
          result.push([item, info.success, "SMTP Connection Timeout"]);
          console.log("SMTP Connection Timeout");
          break;
        case verifyCodes.SMTPConnectionError:
          result.push([item, info.success, "SMTP Connection Error"]);
          console.log("SMTP Connection Error");
          break;

        default:
          result.push([item, info.success, "Unknown Response"]);
          console.log("Unknown Response");
      }
    }
    res.send(result);
  });
}

/* GET request */
router.get("/", function(req, res, next) {
  result = [];
  verifyItem(res, req);
});

module.exports = router;
