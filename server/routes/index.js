const router = require("express").Router();
router.get("/test", async (req,res) => {
  console.log("server works");
});

module.exports = router;
