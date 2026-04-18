const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const Profile = require("../models/profile");

// Helper: Age group classification
function getAgeGroup(age) {
  if (age <= 12) return "child";
  if (age <= 19) return "teenager";
  if (age <= 59) return "adult";
  return "senior";
}

// ======================
// CREATE PROFILE
// ======================
exports.createProfile = async (req, res) => {
  try {
    const { name } = req.body;

    // Validate input
    if (!name || typeof name !== "string") {
      return res.status(400).json({
        status: "error",
        message: "Missing or empty name"
      });
    }

    const normalized = name.toLowerCase();

    // Check duplicate
    const existing = await Profile.findOne({ name: normalized });

    if (existing) {
      return res.status(200).json({
        status: "success",
        message: "Profile already exists",
        data: existing
      });
    }

    // Call external APIs
    const genderRes = await axios.get(`https://api.genderize.io?name=${name}`);
    const ageRes = await axios.get(`https://api.agify.io?name=${name}`);
    const countryRes = await axios.get(`https://api.nationalize.io?name=${name}`);

    // Validate responses
    if (!genderRes.data.gender || genderRes.data.count === 0) {
      return res.status(502).json({
        status: "error",
        message: "Genderize returned an invalid response"
      });
    }

    if (!ageRes.data.age) {
      return res.status(502).json({
        status: "error",
        message: "Agify returned an invalid response"
      });
    }

    if (!countryRes.data.country || countryRes.data.country.length === 0) {
      return res.status(502).json({
        status: "error",
        message: "Nationalize returned an invalid response"
      });
    }

    // Pick highest probability country
    const topCountry = countryRes.data.country.sort(
      (a, b) => b.probability - a.probability
    )[0];

    // Create profile
    const profile = new Profile({
      id: uuidv4(), // ⚠️ later switch to UUID v7
      name: normalized,

      gender: genderRes.data.gender,
      gender_probability: genderRes.data.probability,
      sample_size: genderRes.data.count,

      age: ageRes.data.age,
      age_group: getAgeGroup(ageRes.data.age),

      country_id: topCountry.country_id,
      country_probability: topCountry.probability,

      created_at: new Date().toISOString()
    });

    await profile.save();

    return res.status(201).json({
      status: "success",
      data: profile
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "error",
      message: "Server error"
    });
  }
};

// ======================
// GET SINGLE PROFILE
// ======================
exports.getProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ id: req.params.id });

    if (!profile) {
      return res.status(404).json({
        status: "error",
        message: "Profile not found"
      });
    }

    return res.status(200).json({
      status: "success",
      data: profile
    });

  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Server error"
    });
  }
};

// ======================
// GET ALL PROFILES (FILTER)
// ======================
exports.getAllProfiles = async (req, res) => {
  try {
    const { gender, country_id, age_group } = req.query;

    let filter = {};

    if (gender) filter.gender = gender.toLowerCase();
    if (country_id) filter.country_id = country_id.toUpperCase();
    if (age_group) filter.age_group = age_group.toLowerCase();

    const profiles = await Profile.find(filter);

    return res.status(200).json({
      status: "success",
      count: profiles.length,
      data: profiles
    });

  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Server error"
    });
  }
};

// ======================
// DELETE PROFILE
// ======================
exports.deleteProfile = async (req, res) => {
  try {
    const result = await Profile.deleteOne({ id: req.params.id });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        status: "error",
        message: "Profile not found"
      });
    }

    return res.status(204).send();

  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Server error"
    });
  }
};