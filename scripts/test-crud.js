/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");
const { Pool } = require("pg");

try {
  require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });
  require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });
} catch {
  // Ignore
}

const config = {
  host: process.env.PGHOST || "localhost",
  port: parseInt(process.env.PGPORT || "5432", 10),
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "",
  database: process.env.PGDATABASE || "user_management_demo",
};

async function runTests() {
  console.log("=================================================");
  console.log("   RUNNING USER MANAGEMENT CRUD VERIFICATION");
  console.log("=================================================");

  const pool = new Pool(config);
  const client = await pool.connect();

  try {
    const testEmail = `test.user.${Date.now()}@example.com`;
    let createdUserId = null;

    // Test 1: Create a new user
    console.log("Test 1: Create a new user (INSERT query)...");
    const insertRes = await client.query(
      `INSERT INTO users (full_name, email, phone, department, job_role, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *;`,
      [
        "Arthur Pendelton",
        testEmail,
        "+1 (555) 999-1234",
        "Operations",
        "Logistics Director",
        "Active",
      ]
    );
    if (insertRes.rows.length === 0) throw new Error("Test 1 Failed: No user returned");
    const createdUser = insertRes.rows[0];
    createdUserId = createdUser.id;
    console.log(`✓ Test 1 Passed: User created with ID ${createdUserId} (${createdUser.full_name})`);

    // Test 2: Verify user appears in listing (SELECT query)
    console.log("Test 2: Verify user appears in user listing (SELECT query)...");
    const listRes = await client.query(
      `SELECT * FROM users WHERE id = $1;`,
      [createdUserId]
    );
    if (listRes.rows.length !== 1) throw new Error("Test 2 Failed: User not found in listing");
    console.log(`✓ Test 2 Passed: User retrieved successfully (${listRes.rows[0].email})`);

    // Test 3: Refresh/Persistence check
    console.log("Test 3: Verify user persistence across client instances...");
    const persistClient = await pool.connect();
    const persistRes = await persistClient.query(
      `SELECT id, email, status FROM users WHERE id = $1;`,
      [createdUserId]
    );
    persistClient.release();
    if (persistRes.rows.length !== 1) throw new Error("Test 3 Failed: User was not persistent");
    console.log(`✓ Test 3 Passed: User is persisted in PostgreSQL table`);

    // Test 4: Update user's department (UPDATE query)
    console.log("Test 4: Update user's department to 'Executive Leadership'...");
    const updateRes = await client.query(
      `UPDATE users
       SET department = $1,
           job_role = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *;`,
      ["Executive Leadership", "VP of Global Logistics", createdUserId]
    );
    if (updateRes.rows.length === 0) throw new Error("Test 4 Failed: Update failed");
    console.log(`✓ Test 4 Passed: UPDATE query executed`);

    // Test 5: Verify updated information is stored
    console.log("Test 5: Verify updated department is stored...");
    const verifyUpdate = await client.query(
      `SELECT department, job_role, updated_at FROM users WHERE id = $1;`,
      [createdUserId]
    );
    if (verifyUpdate.rows[0].department !== "Executive Leadership") {
      throw new Error(`Test 5 Failed: Expected 'Executive Leadership', got ${verifyUpdate.rows[0].department}`);
    }
    console.log(`✓ Test 5 Passed: Verified stored department: "${verifyUpdate.rows[0].department}"`);

    // Test 6: Search for the user (ILIKE queries)
    console.log("Test 6: Search for user by name, email, and department...");
    const searchRes = await client.query(
      `SELECT * FROM users
       WHERE full_name ILIKE $1 OR email ILIKE $1 OR department ILIKE $1;`,
      ["%Pendelton%"]
    );
    if (searchRes.rows.length === 0) throw new Error("Test 6 Failed: Search returned 0 rows");
    console.log(`✓ Test 6 Passed: Found ${searchRes.rows.length} record(s) matching '%Pendelton%'`);

    // Test 7: Delete the user (DELETE query)
    console.log(`Test 7: Delete the user ID ${createdUserId}...`);
    const deleteRes = await client.query(
      `DELETE FROM users WHERE id = $1 RETURNING *;`,
      [createdUserId]
    );
    if (deleteRes.rows.length === 0) throw new Error("Test 7 Failed: DELETE did not return user");
    console.log(`✓ Test 7 Passed: DELETE query returned deleted user ID ${deleteRes.rows[0].id}`);

    // Test 8: Verify user is completely removed from PostgreSQL
    console.log("Test 8: Verify user is removed from PostgreSQL...");
    const verifyDelete = await client.query(
      `SELECT * FROM users WHERE id = $1;`,
      [createdUserId]
    );
    if (verifyDelete.rows.length !== 0) throw new Error("Test 8 Failed: User still exists in database");
    console.log(`✓ Test 8 Passed: User #${createdUserId} successfully deleted from PostgreSQL!`);

    console.log("=================================================");
    console.log("   ALL 8 FUNCTIONAL TESTS PASSED PERFECTLY!   ");
    console.log("=================================================");
  } finally {
    client.release();
    await pool.end();
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

