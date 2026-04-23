const axios = require("axios");
const { v7: uuidv7 } = require("uuid");
const { Op } = require('sequelize');
const Profile = require("../models/profile");
const { getCountryName } = require("../utils/countryMapping");
const NaturalLanguageParser = require("../utils/searchParser");

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
    const existing = await Profile.findOne({ where: { name: normalized } });

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
    const profile = await Profile.create({
      id: uuidv7(), // ✅ UUID v7
      name: normalized,

      gender: genderRes.data.gender,
      gender_probability: genderRes.data.probability,

      age: ageRes.data.age,
      age_group: getAgeGroup(ageRes.data.age),

      country_id: topCountry.country_id,
      country_name: getCountryName(topCountry.country_id),
      country_probability: topCountry.probability,

      created_at: new Date()
    });

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
    const profile = await Profile.findByPk(req.params.id);

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
// GET ALL PROFILES (ADVANCED FILTERING, SORTING, PAGINATION)
// ======================
exports.getAllProfiles = async (req, res) => {
  try {
    // Query parameters
    const {
      gender,
      age_group,
      country_id,
      min_age,
      max_age,
      min_gender_probability,
      min_country_probability,
      sort_by = "created_at",
      sort_order = "desc",
      page = 1,
      limit = 10
    } = req.query;

    // Validate sort_by
    const sortFieldMap = {
      "age": "age",
      "created_at": "createdAt",
      "gender_probability": "gender_probability"
    };
    const validSortFields = Object.keys(sortFieldMap);
    if (sort_by && !validSortFields.includes(sort_by)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid sort_by parameter"
      });
    }

    // Validate sort_order
    if (sort_order && !["asc", "desc"].includes(sort_order.toLowerCase())) {
      return res.status(400).json({
        status: "error",
        message: "Invalid sort_order parameter"
      });
    }
    const where = {};

    // Gender filter
    if (gender) {
      where.gender = gender.toLowerCase();
    }

    // Age group filter
    if (age_group) {
      where.age_group = age_group.toLowerCase();
    }

    // Country filter
    if (country_id) {
      where.country_id = country_id.toUpperCase();
    }

    // Min/Max age filters
    if (min_age || max_age) {
      where.age = {};
      if (min_age) {
        where.age[Op.gte] = parseInt(min_age, 10);
      }
      if (max_age) {
        where.age[Op.lte] = parseInt(max_age, 10);
      }
    }

    // Min gender probability filter
    if (min_gender_probability) {
      where.gender_probability = {
        [Op.gte]: parseFloat(min_gender_probability)
      };
    }

    // Min country probability filter
    if (min_country_probability) {
      where.country_probability = {
        [Op.gte]: parseFloat(min_country_probability)
      };
    }

    // Validate pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = parseInt(limit, 10) || 10;
    if (parsedLimit > 50) {
      return res.status(400).json({
        status: "error",
        message: "Limit cannot exceed 50"
      });
    }
    const limitNum = Math.max(1, parsedLimit);
    const offset = (pageNum - 1) * limitNum;

    // Build order clause
    const sortField = sortFieldMap[sort_by] || "createdAt";
    const sortDir = sort_order === "asc" ? "ASC" : "DESC";
    const order = [[sortField, sortDir]];

    // Execute query with pagination and sorting
    const { count, rows } = await Profile.findAndCountAll({
      where,
      order,
      limit: limitNum,
      offset
    });

    return res.status(200).json({
      status: "success",
      data: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total_count: count,
        total_pages: Math.ceil(count / limitNum)
      }
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
// DELETE PROFILE
// ======================
exports.deleteProfile = async (req, res) => {
  try {
    const deletedCount = await Profile.destroy({ where: { id: req.params.id } });

    if (deletedCount === 0) {
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

// ======================
// NATURAL LANGUAGE SEARCH
// ======================
exports.searchProfiles = async (req, res) => {
  try {
    const {
      q: query,
      sort_by = "created_at",
      sort_order = "desc",
      page = 1,
      limit = 10
    } = req.query;

    // Validate sort_by
    const validSortFields = ["age", "created_at", "gender_probability"];
    if (sort_by && !validSortFields.includes(sort_by)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid sort_by parameter"
      });
    }

    // Validate sort_order
    if (sort_order && !["asc", "desc"].includes(sort_order.toLowerCase())) {
      return res.status(400).json({
        status: "error",
        message: "Invalid sort_order parameter"
      });
    }

    const searchQuery = query;

    if (!searchQuery || typeof searchQuery !== "string" || searchQuery.trim().length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Query parameter 'q' is required and must be non-empty"
      });
    }

    // Parse natural language query into filters
    const parser = new NaturalLanguageParser();
    const parsedFilters = parser.parse(searchQuery);

    // Check if query was interpretable
    if (Object.keys(parsedFilters).length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Uninterpretable query"
      });
    }

    // Build Sequelize where clause from parsed data
    const where = {};

    if (parsedFilters.gender) {
      where.gender = parsedFilters.gender;
    }

    if (parsedFilters.min_age || parsedFilters.max_age) {
      where.age = {};
      if (parsedFilters.min_age !== undefined) {
        where.age[Op.gte] = parsedFilters.min_age;
      }
      if (parsedFilters.max_age !== undefined) {
        where.age[Op.lte] = parsedFilters.max_age;
      }
    }

    if (parsedFilters.country_id) {
      where.country_id = parsedFilters.country_id.toUpperCase();
    }

    if (parsedFilters.min_gender_probability) {
      where.gender_probability = {
        [Op.gte]: parsedFilters.min_gender_probability
      };
    }

    if (parsedFilters.min_country_probability) {
      where.country_probability = {
        [Op.gte]: parsedFilters.min_country_probability
      };
    }

    if (parsedFilters.age_group) {
      where.age_group = parsedFilters.age_group;
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = parseInt(limit, 10) || 10;
    if (parsedLimit > 50) {
      return res.status(400).json({
        status: "error",
        message: "Limit cannot exceed 50"
      });
    }
    const limitNum = Math.max(1, parsedLimit);
    const offset = (pageNum - 1) * limitNum;

    // Sorting
    const validSortFields = ["age", "created_at", "gender_probability"];
    const sortField = validSortFields.includes(sort_by) ? sort_by : "created_at";
    const sortDir = sort_order === "asc" ? "ASC" : "DESC";
    const order = [[sortField, sortDir]];

    // Execute query
    const { count, rows } = await Profile.findAndCountAll({
      where,
      order,
      limit: limitNum,
      offset
    });

    return res.status(200).json({
      status: "success",
      query: searchQuery,
      parsed_filters: parsedFilters,
      data: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total_count: count,
        total_pages: Math.ceil(count / limitNum)
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      message: "Server error"
    });
  }
};