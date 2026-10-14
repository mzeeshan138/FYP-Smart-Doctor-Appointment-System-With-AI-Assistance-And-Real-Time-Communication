import assert from "node:assert/strict";
import test from "node:test";
import jwt from "jsonwebtoken";
import request from "supertest";

process.env.JWT_SECRET = "user-controller-test-secret";

const { default: app } = await import("../app.js");
const { default: userModel } = await import("../models/userModel.js");
const { default: emailVerificationModel } = await import("../models/emailVerificationModel.js");

const users = [];
const verifiedEmails = new Set(["new.patient@example.test"]);
const original = {
  findOne: userModel.findOne,
  findById: userModel.findById,
  save: userModel.prototype.save,
  verificationFindOne: emailVerificationModel.findOne,
  verificationDeleteOne: emailVerificationModel.deleteOne,
};

test.before(() => {
  userModel.prototype.save = async function save() {
    if (!users.includes(this)) users.push(this);
    return this;
  };
  userModel.findOne = async ({ email }) => users.find((user) => user.email === email) || null;
  userModel.findById = (id) => ({
    select: async () => users.find((user) => String(user._id) === String(id)) || null,
  });
  emailVerificationModel.findOne = async ({ email, verified }) =>
    verified && verifiedEmails.has(email) ? { email, verified: true } : null;
  emailVerificationModel.deleteOne = async () => ({ deletedCount: 1 });
});

test.after(() => {
  userModel.findOne = original.findOne;
  userModel.findById = original.findById;
  userModel.prototype.save = original.save;
  emailVerificationModel.findOne = original.verificationFindOne;
  emailVerificationModel.deleteOne = original.verificationDeleteOne;
});

test("easy: login reports an unknown user", async () => {
  const response = await request(app)
    .post("/api/user/login")
    .send({ email: "missing@example.test", password: "any-password" });

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, {
    success: false,
    message: "User does not exist",
  });
});

test("medium: profile endpoint requires a user token", async () => {
  const response = await request(app).get("/api/user/get-profile");

  assert.equal(response.status, 200);
  assert.equal(response.body.success, false);
  assert.equal(response.body.message, "Not Authorized Login Again");
});

test("medium: authenticated user can read their profile", async () => {
  const user = new userModel({
    name: "Existing Patient",
    email: "existing.patient@example.test",
    password: "hashed-password",
  });
  await user.save();
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

  const response = await request(app)
    .get("/api/user/get-profile")
    .set("token", token);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.userData.email, user.email);
});

test("hard: verified registration creates a user and blocks duplicates", async () => {
  const email = "new.patient@example.test";
  const verificationToken = jwt.sign(
    { purpose: "email_verification", email },
    process.env.JWT_SECRET
  );
  const payload = {
    name: "New Patient",
    email,
    password: "StrongPass123!",
    verificationToken,
  };

  const created = await request(app).post("/api/user/register").send(payload);
  assert.equal(created.status, 200);
  assert.equal(created.body.success, true);
  assert.ok(created.body.token);

  const duplicate = await request(app).post("/api/user/register").send(payload);
  assert.equal(duplicate.status, 409);
  assert.equal(duplicate.body.success, false);
  assert.equal(duplicate.body.message, "User with email already exists");
});
