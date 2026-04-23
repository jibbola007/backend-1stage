const { getCountryId } = require("./countryMapping");

/**
 * Natural Language Search Parser (Rule-based, no AI/LLMs)
 * 
 * Supported patterns:
 * - "young" → ages 16-24
 * - "adult" → ages 25-59
 * - "teenager" → ages 13-19
 * - "child" → ages 0-12
 * - "senior" → ages 60+
 * - "male" or "female" → gender filter
 * - country names → country_id filter
 * - "age: X to Y" or "age: X-Y" → age range
 * - "probability: X" or "gender probability: X" → min gender probability
 */
class NaturalLanguageParser {
  constructor() {
    this.ageGroupMap = {
      "child": { min: 0, max: 12 },
      "children": { min: 0, max: 12 },
      "young": { min: 16, max: 24 },
      "teenager": { min: 13, max: 19 },
      "teens": { min: 13, max: 19 },
      "adult": { min: 25, max: 59 },
      "adults": { min: 25, max: 59 },
      "senior": { min: 60, max: 150 },
      "elderly": { min: 60, max: 150 },
      "old": { min: 60, max: 150 }
    };

    this.genderMap = {
      "male": "male",
      "man": "male",
      "men": "male",
      "boy": "male",
      "masculine": "male",
      "female": "female",
      "woman": "female",
      "women": "female",
      "girl": "female",
      "feminine": "female"
    };
  }

  /**
   * Parse natural language query into filter object
   * @param {string} query - User's natural language query
   * @returns {object} Filter object for database query
   */
  parse(query) {
    if (!query || typeof query !== "string") {
      return {};
    }

    const lowerQuery = query.toLowerCase().trim();
    const filters = {};

    // Parse age groups (e.g., "young", "adult", "teenager")
    const ageGroupMatch = this.parseAgeGroup(lowerQuery);
    if (ageGroupMatch) {
      filters.min_age = ageGroupMatch.min;
      filters.max_age = ageGroupMatch.max;
    }

    // Parse explicit age ranges (e.g., "age 20 to 30", "age: 20-30")
    const ageRangeMatch = this.parseAgeRange(lowerQuery);
    if (ageRangeMatch) {
      filters.min_age = ageRangeMatch.min;
      filters.max_age = ageRangeMatch.max;
    }

    // Parse gender
    const gender = this.parseGender(lowerQuery);
    if (gender) {
      filters.gender = gender;
    }

    // Parse country
    const country = this.parseCountry(lowerQuery);
    if (country) {
      filters.country_id = country;
    }

    // Parse probability thresholds
    const probMatch = this.parseProbability(lowerQuery);
    if (probMatch) {
      filters.min_gender_probability = probMatch;
    }

    return filters;
  }

  /**
   * Parse age group keywords
   */
  parseAgeGroup(query) {
    for (const [keyword, ageRange] of Object.entries(this.ageGroupMap)) {
      if (query.includes(keyword)) {
        return ageRange;
      }
    }
    return null;
  }

  /**
   * Parse explicit age ranges: "age 20 to 30", "age: 20-30", "between 20 and 30"
   */
  parseAgeRange(query) {
    // Pattern: "age X to Y", "age: X to Y", "age X-Y"
    const patterns = [
      /age\s*:?\s*(\d+)\s*(?:to|-|and)\s*(\d+)/gi,
      /between\s+(\d+)\s+and\s+(\d+)\s+years?/gi,
      /(\d+)\s*(?:to|-)\s*(\d+)\s+years?\s+old/gi
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(query);
      if (match) {
        const min = parseInt(match[1], 10);
        const max = parseInt(match[2], 10);
        if (!isNaN(min) && !isNaN(max)) {
          return { min, max };
        }
      }
    }
    return null;
  }

  /**
   * Parse gender keywords
   */
  parseGender(query) {
    for (const [keyword, gender] of Object.entries(this.genderMap)) {
      if (query.includes(keyword)) {
        return gender;
      }
    }
    return null;
  }

  /**
   * Parse country names/codes
   */
  parseCountry(query) {
    // Try to extract country name or code from query
    // Split by common delimiters and check each word/phrase
    const words = query.split(/[\s,;]+/);
    
    for (const word of words) {
      if (word.length >= 2) {
        // Try as country code
        const upperWord = word.toUpperCase();
        if (upperWord.length === 2) {
          // Could be country code
          const countryId = getCountryId(word) || (this.isValidCountryCode(upperWord) ? upperWord : null);
          if (countryId) return countryId;
        }
        
        // Try as country name
        const countryId = getCountryId(word);
        if (countryId) return countryId;
      }
    }
    return null;
  }

  /**
   * Parse probability threshold (e.g., "90% confident", "probability 0.9")
   */
  parseProbability(query) {
    const patterns = [
      /probability\s*:?\s*([\d.]+)/gi,
      /([\d.]+)\s*%\s*(?:confidence|confident|probability)/gi,
      /(?:at least|minimum)\s+([\d.]+)/gi
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(query);
      if (match) {
        let prob = parseFloat(match[1]);
        // Convert percentage to decimal if needed
        if (prob > 1) {
          prob = prob / 100;
        }
        if (prob >= 0 && prob <= 1) {
          return prob;
        }
      }
    }
    return null;
  }

  /**
   * Check if string is a valid ISO country code
   */
  isValidCountryCode(code) {
    // Simple check: 2-letter uppercase codes
    return /^[A-Z]{2}$/.test(code);
  }
}

module.exports = NaturalLanguageParser;
