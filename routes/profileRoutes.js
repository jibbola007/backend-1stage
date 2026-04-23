const express = require("express");
const router = express.Router();

const {
  createProfile,
  getProfile,
  getAllProfiles,
  deleteProfile,
  searchProfiles
} = require("../controllers/profileController");

// POST
router.post("/profiles", createProfile);

// GET ONE
router.get("/profiles/:id", getProfile);

// GET ALL (Advanced filtering, sorting, pagination)
router.get("/profiles", getAllProfiles);

// SEARCH (Natural Language)
router.post("/profiles/search", searchProfiles);

// DELETE
router.delete("/profiles/:id", deleteProfile);

module.exports = router;