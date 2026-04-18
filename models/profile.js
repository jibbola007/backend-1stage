const mongoose = require("./db");

const profileSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true, unique: true },

  gender: String,
  gender_probability: Number,
  sample_size: Number,

  age: Number,
  age_group: String,

  country_id: String,
  country_probability: Number,

  created_at: String
});

module.exports = mongoose.model("Profile", profileSchema);