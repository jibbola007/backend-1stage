/**
 * API Test Script
 * Tests all endpoints to verify functionality
 */

const axios = require("axios");

const API_BASE = "http://localhost:3000/api";

async function testAPIs() {
  try {
    console.log("\n🧪 Testing Insighta Labs API\n");

    // Test 1: Get all profiles with pagination
    console.log("✅ Test 1: GET /profiles (Basic)");
    const test1 = await axios.get(`${API_BASE}/profiles?limit=2`);
    console.log(`   Status: ${test1.data.status}`);
    console.log(`   Results: ${test1.data.data.length}`);
    console.log(`   Total: ${test1.data.pagination.total}`);

    // Test 2: Filter by gender
    console.log("\n✅ Test 2: GET /profiles (Filter by gender=male)");
    const test2 = await axios.get(`${API_BASE}/profiles?gender=male&limit=3`);
    console.log(`   Status: ${test2.data.status}`);
    console.log(`   Results: ${test2.data.data.length}`);
    console.log(`   Sample: ${test2.data.data[0]?.name || "No data"}`);

    // Test 3: Sort by age
    console.log("\n✅ Test 3: GET /profiles (Sort by age asc)");
    const test3 = await axios.get(`${API_BASE}/profiles?sort_by=age&sort_order=asc&limit=2`);
    console.log(`   Status: ${test3.data.status}`);
    console.log(`   Youngest age: ${test3.data.data[0]?.age || "N/A"}`);
    console.log(`   Names: ${test3.data.data.map(p => p.name).join(", ")}`);

    // Test 4: Natural language search
    console.log("✅ Test 4: POST /profiles/search (Natural language: 'young males')");
    const test4 = await axios.post(`${API_BASE}/profiles/search`, { query: 'young males' }, { params: { limit: 3 } });
    console.log(`   Status: ${test4.data.status}`);
    console.log(`   Query: ${test4.data.query}`);
    console.log(`   Parsed Filters:`, test4.data.parsed_filters);
    console.log(`   Results: ${test4.data.data.length}`);

    // Test 5: Search with country
    console.log("\n✅ Test 5: POST /profiles/search (Search with country)");
    const test5 = await axios.post(`${API_BASE}/profiles/search`, { query: 'adults from Nigeria' }, { params: { limit: 2 } });
    console.log(`   Status: ${test5.data.status}`);
    console.log(`   Query: ${test5.data.query}`);
    console.log(`   Parsed Filters:`, test5.data.parsed_filters);
    console.log(`   Results: ${test5.data.data.length}`);

    // Test 6: Multiple filters
    console.log("\n✅ Test 6: GET /profiles (Multiple filters)");
    const test6 = await axios.get(`${API_BASE}/profiles?gender=female&min_age=20&max_age=40&country_id=ZA&limit=2`);
    console.log(`   Status: ${test6.data.status}`);
    console.log(`   Results: ${test6.data.data.length}`);
    console.log(`   Countries: ${test6.data.data.map(p => p.country_id).join(", ")}`);

    // Test 7: Get single profile
    if (test1.data.data.length > 0) {
      console.log("\n✅ Test 7: GET /profiles/:id (Single profile)");
      const profileId = test1.data.data[0].id;
      const test7 = await axios.get(`${API_BASE}/profiles/${profileId}`);
      console.log(`   Status: ${test7.data.status}`);
      console.log(`   Profile Name: ${test7.data.data.name}`);
      console.log(`   ID: ${test7.data.data.id}`);
    }

    console.log("\n✅ All tests passed!\n");
  } catch (error) {
    console.error("\n❌ Test failed:");
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Error: ${error.response.data.message || error.message}`);
    } else {
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  }
}

testAPIs();
