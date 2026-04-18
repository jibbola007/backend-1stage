const express = require("express");
const router = express.Router();

const {
  createProfile,
  getProfile,
  getAllProfiles,
  deleteProfile
} = require("../controllers/profileController");

// POST
router.post("/profiles", createProfile);

// GET ONE
router.get("/profiles/:id", getProfile);

// GET ALL
router.get("/profiles", getAllProfiles);

// DELETE
router.delete("/profiles/:id", deleteProfile);

module.exports = router;