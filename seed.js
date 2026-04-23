/**
 * Seed script for populating the profiles database
 * Usage: node seed.js <path-to-json-file>
 * 
 * The JSON file should contain an array of profile objects with the following structure:
 * [
 *   {
 *     "id": "uuid-v7",
 *     "name": "John Doe",
 *     "gender": "male",
 *     "gender_probability": 0.95,
 *     "age": 30,
 *     "age_group": "adult",
 *     "country_id": "US",
 *     "country_name": "United States",
 *     "country_probability": 0.85,
 *     "created_at": "2026-01-01T00:00:00Z"
 *   },
 *   ...
 * ]
 */

const fs = require("fs");
const path = require("path");
const sequelize = require("./models/db");
const Profile = require("./models/profile");
const { getCountryName } = require("./utils/countryMapping");
const { v7: uuidv7 } = require("uuid");

async function seedDatabase(jsonFilePath) {
  try {
    console.log("🌱 Starting database seeding...");

    // Read JSON file
    if (!jsonFilePath) {
      console.error("❌ Error: JSON file path required as argument");
      console.error("Usage: node seed.js <path-to-json-file>");
      process.exit(1);
    }

    if (!fs.existsSync(jsonFilePath)) {
      console.error(`❌ Error: File not found: ${jsonFilePath}`);
      process.exit(1);
    }

    const fileContent = fs.readFileSync(jsonFilePath, "utf-8");
    let profilesData = JSON.parse(fileContent);

    // Ensure it's an array
    if (!Array.isArray(profilesData)) {
      if (profilesData.profiles && Array.isArray(profilesData.profiles)) {
        profilesData = profilesData.profiles;
      } else {
        console.error("❌ Error: JSON must contain an array of profiles or a 'profiles' array");
        process.exit(1);
      }
    }

    console.log(`📊 Found ${profilesData.length} profiles in JSON file`);

    // Normalize and validate profiles
    const normalizedProfiles = profilesData.map((profile, index) => ({
      id: profile.id || uuidv7(),
      name: profile.name?.toLowerCase().trim(),
      gender: profile.gender?.toLowerCase(),
      gender_probability: typeof profile.gender_probability === "number" ? profile.gender_probability : 0,
      age: typeof profile.age === "number" ? profile.age : 0,
      age_group: profile.age_group?.toLowerCase() || classifyAgeGroup(profile.age),
      country_id: profile.country_id?.toUpperCase(),
      country_name: profile.country_name || getCountryName(profile.country_id),
      country_probability: typeof profile.country_probability === "number" ? profile.country_probability : 0,
      created_at: profile.created_at ? new Date(profile.created_at) : new Date(),
      updated_at: profile.updated_at ? new Date(profile.updated_at) : new Date()
    }));

    // Check for duplicates before seeding
    const beforeCount = await Profile.count();
    console.log(`📈 Existing profiles in database: ${beforeCount}`);

    // Idempotent seeding: upsert based on name (unique constraint)
    let processedCount = 0;
    const errors = [];

    for (const profile of normalizedProfiles) {
      try {
        await Profile.upsert(profile, {
          returning: true
        });
        processedCount++;
      } catch (error) {
        if (error.name !== 'SequelizeUniqueConstraintError') {
          errors.push({
            profile: profile.name,
            error: error.message
          });
        }
      }
    }

    const afterCount = await Profile.count();
    const insertedCount = Math.max(0, afterCount - beforeCount);
    const skippedCount = processedCount - insertedCount;

    console.log("\n✅ Seeding complete!");
    console.log(`   ✔️  Inserted/Updated: ${insertedCount}`);
    console.log(`   ⏭️  Skipped (already exists): ${skippedCount}`);
    console.log(`   ❌ Errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log("\n⚠️  Errors encountered:");
      errors.forEach((err, i) => {
        console.log(`   ${i + 1}. ${err.profile}: ${err.error}`);
      });
    }

    const finalCount = await Profile.count();
    console.log(`\n📊 Total profiles in database: ${finalCount}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding error:", error.message);
    process.exit(1);
  }
}

// Helper: classify age group
function classifyAgeGroup(age) {
  if (age <= 12) return "child";
  if (age <= 19) return "teenager";
  if (age <= 59) return "adult";
  return "senior";
}

// Get JSON file path from command line arguments
const jsonFilePath = process.argv[2];

if (require.main === module) {
  seedDatabase(jsonFilePath);
}
