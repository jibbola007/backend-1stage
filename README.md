# Insighta Labs - Profiles API

Advanced demographic profile querying system with natural language search capabilities.

## Features

- ✅ **Advanced Filtering**: Gender, age group, country, age ranges, probability thresholds
- ✅ **Flexible Sorting**: Sort by age, creation date, or gender probability
- ✅ **Pagination**: Page-based pagination with configurable limits (max 50 per page)
- ✅ **Natural Language Search**: Rule-based parsing (no AI/LLMs) for intuitive queries
- ✅ **UUID v7 Support**: Modern ID generation
- ✅ **CORS Enabled**: Cross-origin requests supported
- ✅ **Idempotent Seeding**: Safe data loading without duplicates

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database (local or cloud)

### Database Setup

**Option 1: Free Cloud PostgreSQL (Recommended)**

1. **Neon.tech (Free PostgreSQL)**
   - Go to [https://neon.tech](https://neon.tech)
   - Create a free account
   - Create a new project
   - Copy the connection string from the dashboard

2. **Update `.env` file**
   ```bash
   # Copy the connection details from your Neon dashboard
   DB_NAME=your_database_name
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_HOST=your_host.neon.tech
   DB_PORT=5432
   ```

**Option 2: Local PostgreSQL**

If you have PostgreSQL installed locally:
```bash
DB_NAME=profiles_db
DB_USER=postgres
DB_PASSWORD=your_local_password
DB_HOST=localhost
DB_PORT=5432
```

### Installation

```bash
npm install
```

### Start Server

```bash
npm start
# or
node server.js
```

Server runs on `http://localhost:3000`

### Seed Database

Prepare a JSON file with profile data (see format below), then:

```bash
node seed.js <path-to-profiles.json>
```

Example:

```bash
node seed.js ./data/profiles-2026.json
```

**Note:** The seeding script uses Sequelize's `upsert` method for idempotent operations - it will update existing profiles or insert new ones based on the unique `name` constraint.

## API Endpoints

### 1. GET /api/profiles - Advanced Filtering & Pagination

Get profiles with advanced filtering, sorting, and pagination.

#### Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `gender` | string | Filter by gender: `male` or `female` | `?gender=male` |
| `age_group` | string | Filter by age group: `child`, `teenager`, `adult`, `senior` | `?age_group=adult` |
| `country_id` | string | Filter by ISO country code (2-letter) | `?country_id=NG` |
| `min_age` | number | Minimum age (inclusive) | `?min_age=25` |
| `max_age` | number | Maximum age (inclusive) | `?max_age=65` |
| `min_gender_probability` | float | Minimum gender probability (0-1) | `?min_gender_probability=0.8` |
| `min_country_probability` | float | Minimum country probability (0-1) | `?min_country_probability=0.7` |
| `sort_by` | string | Sort field: `age`, `created_at`, `gender_probability` | `?sort_by=age` |
| `sort_order` | string | Sort order: `asc` or `desc` (default: `desc`) | `?sort_order=asc` |
| `page` | number | Page number (default: 1, min: 1) | `?page=2` |
| `limit` | number | Results per page (default: 10, max: 50) | `?limit=20` |

#### Examples

```bash
# Get all adult males from Nigeria, sorted by age
GET /api/profiles?gender=male&age_group=adult&country_id=NG&sort_by=age&sort_order=asc

# Get young adults (25-35) with high gender probability, paginated
GET /api/profiles?min_age=25&max_age=35&min_gender_probability=0.9&page=1&limit=25

# Get all profiles sorted by creation date, page 3 with 15 results per page
GET /api/profiles?sort_by=created_at&sort_order=asc&page=3&limit=15

# Combine multiple filters (AND logic)
GET /api/profiles?gender=female&age_group=teenager&country_id=KE&min_gender_probability=0.85
```

#### Response

```json
{
  "status": "success",
  "data": [
    {
      "id": "0190b4ff-8e7e-7000-ab12-3c4d5e6f7a8b",
      "name": "ayanda dlamini",
      "gender": "female",
      "gender_probability": 0.92,
      "age": 28,
      "age_group": "adult",
      "country_id": "ZA",
      "country_name": "South Africa",
      "country_probability": 0.88,
      "created_at": "2026-04-23T08:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2026,
    "pages": 203
  }
}
```

### 2. POST /api/profiles/search - Natural Language Search

Search profiles using natural language queries.

#### Request Body

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `query` | string | **REQUIRED** Natural language query | `"young males from Nigeria"` |
| `sort_by` | string | Sort field (same as /profiles) | `"age"` |
| `sort_order` | string | Sort order: `asc` or `desc` | `"asc"` |
| `page` | number | Page number | `1` |
| `limit` | number | Results per page (max 50) | `25` |

#### Natural Language Parser Guide

The search endpoint parses natural language queries into structured filters. **No AI or LLMs are used** - only rule-based pattern matching.

##### Supported Patterns

**Age Groups:**
- `"young"` → ages 16-24
- `"teenager"` or `"teens"` → ages 13-19
- `"child"` or `"children"` → ages 0-12
- `"adult"` or `"adults"` → ages 25-59
- `"senior"` or `"elderly"` or `"old"` → ages 60+

**Explicit Age Ranges:**
- `"age 25 to 35"` → min_age=25, max_age=35
- `"age: 20-30"` → min_age=20, max_age=30
- `"between 18 and 65 years old"` → min_age=18, max_age=65

**Gender:**
- `"male"`, `"man"`, `"men"`, `"boy"` → gender=male
- `"female"`, `"woman"`, `"women"`, `"girl"` → gender=female

**Countries:**
- Country names: `"Nigeria"`, `"Kenya"`, `"South Africa"` → Mapped to ISO codes
- ISO codes: `"NG"`, `"KE"`, `"ZA"` → Direct code matching

**Probability Thresholds:**
- `"90% confident"` → min_gender_probability=0.9
- `"probability 0.85"` → min_gender_probability=0.85
- `"at least 0.95"` → min_gender_probability=0.95

##### Examples

```bash
# Search for young females
POST /api/profiles/search
Body: { "query": "young females" }

# Search for adults from Nigeria with high confidence
POST /api/profiles/search
Body: { "query": "adult people from Nigeria with 85% confidence" }

# Search for teenagers aged 15-19
POST /api/profiles/search
Body: { "query": "teenagers aged 15 to 19" }

# Complex query with multiple conditions
POST /api/profiles/search
Body: { "query": "young adult males from Kenya with 90% probability" }

# With pagination and sorting
POST /api/profiles/search
Body: { "query": "seniors from South Africa", "sort_by": "age", "sort_order": "desc", "page": 1, "limit": 20 }
```

#### Response

```json
{
  "status": "success",
  "query": "young males from Nigeria",
  "parsed_filters": {
    "gender": "male",
    "min_age": 16,
    "max_age": 24,
    "country_id": "NG"
  },
  "data": [
    {
      "id": "0190b4ff-8e7e-7000-ab12-3c4d5e6f7a8b",
      "name": "chukwu okafor",
      "gender": "male",
      "gender_probability": 0.94,
      "age": 21,
      "age_group": "teenager",
      "country_id": "NG",
      "country_name": "Nigeria",
      "country_probability": 0.91,
      "created_at": "2026-04-23T08:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 125,
    "pages": 13
  }
}
```

### 3. GET /api/profiles/:id - Get Single Profile

Retrieve a specific profile by ID.

#### Example

```bash
GET /api/profiles/0190b4ff-8e7e-7000-ab12-3c4d5e6f7a8b
```

#### Response

```json
{
  "status": "success",
  "data": {
    "id": "0190b4ff-8e7e-7000-ab12-3c4d5e6f7a8b",
    "name": "amara osei",
    "gender": "female",
    "gender_probability": 0.89,
    "age": 34,
    "age_group": "adult",
    "country_id": "GH",
    "country_name": "Ghana",
    "country_probability": 0.92,
    "created_at": "2026-04-23T08:30:00.000Z"
  }
}
```

### 4. POST /api/profiles - Create Profile

Create a new profile by providing a name. The system will fetch demographic data from external APIs.

#### Request Body

```json
{
  "name": "John Doe"
}
```

#### Response

```json
{
  "status": "success",
  "data": {
    "id": "0190b4ff-8e7e-7000-ab12-3c4d5e6f7a8b",
    "name": "john doe",
    "gender": "male",
    "gender_probability": 0.95,
    "age": 45,
    "age_group": "adult",
    "country_id": "US",
    "country_name": "United States",
    "country_probability": 0.72,
    "created_at": "2026-04-23T08:30:00.000Z"
  }
}
```

### 5. DELETE /api/profiles/:id - Delete Profile

Delete a profile by ID.

#### Example

```bash
DELETE /api/profiles/0190b4ff-8e7e-7000-ab12-3c4d5e6f7a8b
```

#### Response

- **204 No Content** - Profile deleted successfully
- **404 Not Found** - Profile not found

## Data Seeding

### JSON File Format

Your profiles JSON file must contain an array of profile objects:

```json
[
  {
    "id": "0190b4ff-8e7e-7000-ab12-3c4d5e6f7a8b",
    "name": "John Doe",
    "gender": "male",
    "gender_probability": 0.95,
    "age": 30,
    "age_group": "adult",
    "country_id": "NG",
    "country_name": "Nigeria",
    "country_probability": 0.85,
    "created_at": "2026-01-01T00:00:00Z"
  },
  {
    "id": "0190b4ff-8e7e-7000-ab12-3c4d5e6f7a8c",
    "name": "Jane Smith",
    "gender": "female",
    "gender_probability": 0.92,
    "age": 28,
    "age_group": "adult",
    "country_id": "KE",
    "country_name": "Kenya",
    "country_probability": 0.88,
    "created_at": "2026-01-01T00:00:00Z"
  }
]
```

Or with optional fields:

```json
[
  {
    "name": "Kofi Mensah",
    "gender": "male",
    "gender_probability": 0.89,
    "age": 35,
    "country_id": "GH"
  }
]
```

**Optional Fields:**
- `id` - Auto-generated UUID v7 if omitted
- `country_name` - Auto-populated from country_id if omitted
- `age_group` - Auto-calculated from age if omitted
- `created_at` - Current timestamp if omitted

### Idempotent Seeding

The seeding script uses Sequelize's `upsert` logic based on profile names (unique constraint). This means:

✅ **Safe to run multiple times** - No duplicate errors
✅ **Idempotent** - Same data, same result
✅ **Update-friendly** - Can update existing profiles by running seed again with modified data

## Natural Language Parsing Limitations

The search parser uses **rule-based pattern matching without AI/LLMs**. This means:

### ✅ Works Well For:
- Direct keywords: "male", "female", "adult", "senior"
- Explicit ranges: "age 25 to 30", "between 20 and 40"
- Country names and ISO codes: "Nigeria", "NG", "Kenya"
- Simple combinations: "young females from Nigeria"

### ⚠️ Limitations:
- **No semantic understanding**: "guys" (plural male) not recognized, use "male" or "men"
- **No fuzzy matching**: Typos won't be corrected ("nigera" won't match "Nigeria")
- **No negation**: Can't search "NOT male" or "excluding Nigeria"
- **No complex logic**: Only AND operations, no OR or NOT
- **Limited context**: Multi-word queries parsed by simple pattern matching
- **No abbreviations**: Only full country names or official ISO codes accepted
- **Fixed age ranges**: Only predefined age groups ("young", "adult", etc.) without custom parsing

### Examples of Limitations

```bash
# ✅ Works: Clear keywords
GET /api/profiles/search?q=adult females from South Africa

# ❌ Doesn't work: Slang/synonyms
GET /api/profiles/search?q=guys from Nigeria
# Workaround: GET /api/profiles/search?q=males from Nigeria

# ❌ Doesn't work: Typos
GET /api/profiles/search?q=adult from nigera
# Workaround: GET /api/profiles/search?q=adult from Nigeria

# ❌ Doesn't work: Negation
GET /api/profiles/search?q=not female
# Workaround: Use direct filter: GET /api/profiles?gender=male

# ❌ Doesn't work: Complex OR logic
GET /api/profiles/search?q=male or female from NG or KE
# Workaround: Make separate requests
```

## Error Handling

### Common Error Responses

#### 400 Bad Request

```json
{
  "status": "error",
  "message": "Query parameter 'q' is required and must be non-empty"
}
```

#### 404 Not Found

```json
{
  "status": "error",
  "message": "Profile not found"
}
```

#### 500 Server Error

```json
{
  "status": "error",
  "message": "Server error"
}
```

## Supported Countries

The system supports demographic data for African countries. Supported ISO codes include:

NG, BJ, AO, KE, ET, GH, SD, ZA, EG, MA, TZ, UG, CM, SN, CI, MZ, MW, ZM, RW, BW, NA, LS, SZ, MG, MU, SC, DZ, TN, LY, CD, CG, GA, GQ, ST, CF, TD, NE, ML, BF, GM, GW, GN, LR, SL, TG, KM, DJ, ER, SO, SS

Add more countries by updating `utils/countryMapping.js`.

## Architecture

```
backend-1stage/
├── models/
│   ├── db.js              # PostgreSQL connection
│   └── profile.js         # Profile schema & model
├── controllers/
│   └── profileController.js  # API logic & handlers
├── routes/
│   └── profileRoutes.js   # API endpoints
├── utils/
│   ├── countryMapping.js  # Country ID ↔ Name mapping
│   └── searchParser.js    # Natural language parser
├── services/              # (Reserved for future services)
├── server.js              # Express app setup
├── seed.js               # Database seeding script
├── package.json
└── README.md
```

## Performance Considerations

- **Indexing**: Frequently filtered fields are indexed (gender, age, country_id, created_at, etc.)
- **Pagination**: Always paginate large result sets (default 10, max 50 per page)
- **Sorting**: Supports three sortable fields (age, created_at, gender_probability)
- **Query Optimization**: Filters are applied at database level for efficiency

## CORS Configuration

The API supports CORS with `Access-Control-Allow-Origin: *` for all origins.

To restrict to specific origins, update `server.js`:

```javascript
app.use(cors({ origin: "https://your-domain.com" }));
```

## Development

### Debugging

Enable debug logs:

```javascript
// In server.js
const debug = require("debug")("app");
debug("Starting server...");
```

### Running Seed in Dry-Run Mode

Check how many profiles would be inserted:

```bash
# Modify seed.js to log without saving, then:
node seed.js ./profiles.json
```

## Production Deployment

1. **Use environment variables** for PostgreSQL credentials in `.env`.

2. **Set NODE_ENV to production**:

```bash
NODE_ENV=production node server.js
```

3. **Enable request logging** with Morgan or similar

4. **Add rate limiting** to prevent abuse

5. **Validate all inputs** before querying

## Support & Issues

For issues, bugs, or feature requests, please refer to the project documentation or contact the development team.

---

**Built with ❤️ for Insighta Labs**
