import neo4j from "neo4j-driver";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.COGNODB_URI;
const username = process.env.COGNODB_USERNAME;
const password = process.env.COGNODB_PASSWORD;

let driver;

const isNeo4jInteger = (value) =>
  neo4j.isInt?.(value) || (value && typeof value.toNumber === "function" && "low" in value && "high" in value);

const toPlainValue = (value) => {
  if (isNeo4jInteger(value)) {
    return value.toNumber();
  }

  if (Array.isArray(value)) {
    return value.map(toPlainValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, toPlainValue(nestedValue)])
    );
  }

  return value;
};

export const getDriver = async () => {
  if (!driver) {
    try {
      driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
      await driver.verifyConnectivity();
      console.log("✓ Connected to CognoDB");
    } catch (error) {
      console.error("✗ Failed to connect to CognoDB:", error.message);
      throw error;
    }
  }
  return driver;
};

export const closeDriver = async () => {
  if (driver) {
    await driver.close();
    driver = null;
  }
};

export const runQuery = async (query, params = {}) => {
  const driver = await getDriver();
  const session = driver.session();
  try {
    const result = await session.run(query, params);
    return result.records.map((record) => toPlainValue(record.toObject()));
  } finally {
    await session.close();
  }
};
