/* eslint-disable @typescript-eslint/no-require-imports */
async function testApi() {
  const baseUrl = "http://localhost:3000";
  console.log("=========================================");
  console.log("   TESTING LIVE API ENDPOINTS OVER HTTP");
  console.log("=========================================");

  // 1. Health check
  console.log("1. Testing GET /api/health...");
  const healthRes = await fetch(`${baseUrl}/api/health`);
  const healthData = await healthRes.json();
  if (healthRes.status !== 200 || healthData.status !== "connected") {
    throw new Error(`Health check failed: ${JSON.stringify(healthData)}`);
  }
  console.log("✓ GET /api/health: OK -", healthData.message);

  // 2. Dashboard stats
  console.log("2. Testing GET /api/dashboard/stats...");
  const statsRes = await fetch(`${baseUrl}/api/dashboard/stats`);
  const statsData = await statsRes.json();
  if (!statsData.success) {
    throw new Error(`Stats endpoint failed: ${JSON.stringify(statsData)}`);
  }
  console.log("✓ GET /api/dashboard/stats: OK - Total users in DB:", statsData.data.totalUsers);
  console.log("  Active users:", statsData.data.activeUsers, "| Inactive users:", statsData.data.inactiveUsers);

  // 3. User listing
  console.log("3. Testing GET /api/users...");
  const usersRes = await fetch(`${baseUrl}/api/users?page=1&limit=5`);
  const usersData = await usersRes.json();
  if (!usersData.success || !Array.isArray(usersData.data.users)) {
    throw new Error(`Users listing failed: ${JSON.stringify(usersData)}`);
  }
  console.log(`✓ GET /api/users: OK - Retrieved ${usersData.data.users.length} users, total: ${usersData.data.pagination.total}`);

  // 4. Input validation (Missing full_name)
  console.log("4. Testing POST /api/users validation (Missing full_name)...");
  const badReqRes = await fetch(`${baseUrl}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "invalid@example.com" }),
  });
  if (badReqRes.status !== 400) {
    throw new Error(`Expected 400 Bad Request, got ${badReqRes.status}`);
  }
  console.log("✓ Input validation (Missing name): 400 Bad Request handled cleanly");

  // 5. Input validation (Invalid email format)
  console.log("5. Testing POST /api/users validation (Invalid email)...");
  const badEmailRes = await fetch(`${baseUrl}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ full_name: "Test User", email: "not-an-email" }),
  });
  if (badEmailRes.status !== 400) {
    throw new Error(`Expected 400 Bad Request, got ${badEmailRes.status}`);
  }
  console.log("✓ Input validation (Invalid email): 400 Bad Request handled cleanly");

  // 6. Create new user
  console.log("6. Testing POST /api/users (Create User)...");
  const uniqueEmail = `test.api.${Date.now()}@example.com`;
  const createRes = await fetch(`${baseUrl}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      full_name: "Jonathan Archer",
      email: uniqueEmail,
      phone: "+1 (555) 777-8899",
      department: "Engineering",
      job_role: "Principal Architect",
      status: "Active",
    }),
  });
  const createData = await createRes.json();
  if (createRes.status !== 201 || !createData.success) {
    throw new Error(`User creation failed: ${JSON.stringify(createData)}`);
  }
  const createdId = createData.data.id;
  console.log(`✓ POST /api/users: 201 Created - New User ID ${createdId} (${createData.data.full_name})`);

  // 7. Duplicate email handling (409 Conflict)
  console.log("7. Testing POST /api/users duplicate email (409 Conflict)...");
  const dupRes = await fetch(`${baseUrl}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      full_name: "Another Jonathan",
      email: uniqueEmail,
    }),
  });
  const dupData = await dupRes.json();
  if (dupRes.status !== 409) {
    throw new Error(`Expected 409 Conflict, got ${dupRes.status}`);
  }
  console.log("✓ Duplicate email handling: 409 Conflict returned:", dupData.error);

  // 8. Update user
  console.log(`8. Testing PUT /api/users/${createdId}...`);
  const updateRes = await fetch(`${baseUrl}/api/users/${createdId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      full_name: "Captain Jonathan Archer",
      email: uniqueEmail,
      phone: "+1 (555) 777-8899",
      department: "Operations",
      job_role: "Fleet Commander",
      status: "Active",
    }),
  });
  const updateData = await updateRes.json();
  if (updateRes.status !== 200 || !updateData.success) {
    throw new Error(`Update user failed: ${JSON.stringify(updateData)}`);
  }
  console.log("✓ PUT /api/users/:id: 200 OK - Updated Job Role:", updateData.data.job_role);

  // 9. Search user
  console.log("9. Testing GET /api/users?search=Fleet...");
  const searchRes = await fetch(`${baseUrl}/api/users?search=Fleet`);
  const searchData = await searchRes.json();
  if (!searchData.success || searchData.data.users.length === 0) {
    throw new Error(`Search failed: ${JSON.stringify(searchData)}`);
  }
  console.log("✓ Search query: Found matching record -", searchData.data.users[0].full_name);

  // 10. Delete user
  console.log(`10. Testing DELETE /api/users/${createdId}...`);
  const deleteRes = await fetch(`${baseUrl}/api/users/${createdId}`, {
    method: "DELETE",
  });
  const deleteData = await deleteRes.json();
  if (deleteRes.status !== 200 || !deleteData.success) {
    throw new Error(`Delete failed: ${JSON.stringify(deleteData)}`);
  }
  console.log("✓ DELETE /api/users/:id: 200 OK - Deleted User ID", deleteData.data.id);

  // 11. Verify deletion (404)
  console.log(`11. Verifying deleted user returns 404...`);
  const getDeleted = await fetch(`${baseUrl}/api/users/${createdId}`);
  if (getDeleted.status !== 404) {
    throw new Error(`Expected 404, got ${getDeleted.status}`);
  }
  console.log("✓ Verified: Record returns 404 Not Found");

  // 12. Frontend page routes
  console.log("12. Testing frontend page routes...");
  const dashRes = await fetch(`${baseUrl}/dashboard`);
  const usersPageRes = await fetch(`${baseUrl}/users`);
  if (dashRes.status !== 200 || usersPageRes.status !== 200) {
    throw new Error("Frontend pages failed to return 200 OK");
  }
  console.log("✓ /dashboard: 200 OK");
  console.log("✓ /users: 200 OK");

  console.log("=========================================");
  console.log("   ALL 12 END-TO-END HTTP TESTS PASSED!  ");
  console.log("=========================================");
}

testApi().catch((err) => {
  console.error("HTTP API Test Error:", err);
  process.exit(1);
});

