import assert from "node:assert/strict";
import test from "node:test";
import jwt from "jsonwebtoken";
import request from "supertest";
import { v2 as cloudinary } from "cloudinary";

// Exercise the real Express routes without a MongoDB or Cloudinary account.
process.env.ADMIN_EMAIL = "admin@example.test";
process.env.ADMIN_PASSWORD = "AdminPass123!";
process.env.JWT_SECRET = "test-secret";

const { default: app } = await import("../app.js");
const { default: doctorModel } = await import("../models/doctorModel.js");

const doctors = [];
let nextId = 1;
const original = {
  find: doctorModel.find,
  findOne: doctorModel.findOne,
  findById: doctorModel.findById,
  findByIdAndUpdate: doctorModel.findByIdAndUpdate,
  findByIdAndDelete: doctorModel.findByIdAndDelete,
  save: doctorModel.prototype.save,
  upload: cloudinary.uploader.upload,
  destroy: cloudinary.uploader.destroy,
};

const adminToken = () => jwt.sign(
  process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD,
  process.env.JWT_SECRET
);

test.before(() => {
  doctorModel.prototype.save = async function save() {
    this._id = String(nextId++);
    doctors.push(this);
    return this;
  };
  doctorModel.findOne = async ({ $or }) => doctors.find((doctor) =>
    $or.some((filter) => Object.entries(filter).every(
      ([key, value]) => doctor[key] === value
    ))
  ) || null;
  doctorModel.find = () => ({ select: async () => doctors });
  doctorModel.findById = async (id) => doctors.find(
    (doctor) => String(doctor._id) === String(id)
  ) || null;
  doctorModel.findByIdAndUpdate = async (id, update) => {
    const doctor = await doctorModel.findById(id);
    if (doctor) Object.assign(doctor, update);
    return doctor;
  };
  doctorModel.findByIdAndDelete = async (id) => {
    const index = doctors.findIndex((doctor) => String(doctor._id) === String(id));
    return index === -1 ? null : doctors.splice(index, 1)[0];
  };
  cloudinary.uploader.upload = async () => ({ secure_url: "https://example.test/doctor.jpg" });
  cloudinary.uploader.destroy = async () => ({ result: "ok" });
});

test.after(() => {
  Object.assign(doctorModel, {
    find: original.find,
    findOne: original.findOne,
    findById: original.findById,
    findByIdAndUpdate: original.findByIdAndUpdate,
    findByIdAndDelete: original.findByIdAndDelete,
  });
  doctorModel.prototype.save = original.save;
  cloudinary.uploader.upload = original.upload;
  cloudinary.uploader.destroy = original.destroy;
});

test("admin doctor CRUD endpoints", async () => {
  const api = request(app);
  const token = adminToken();
  const doctor = {
    name: "Dr Ada Lovelace",
    email: "ada@example.test",
    password: "StrongPass123!",
    speciality: "General physician",
    degree: "MBBS",
    experience: "5 Years",
    about: "Experienced primary-care doctor.",
    fees: "1500",
    phone: "3001234567",
    address: JSON.stringify({ line1: "Test Street", line2: "Test City" }),
  };

  const create = await api.post("/api/admin/add-doctor").set("atoken", token)
    .field(doctor).attach("image", Buffer.from("test-image"), "doctor.jpg");
  assert.equal(create.status, 200);
  assert.equal(create.body.success, true);
  assert.equal(doctors.length, 1);

  const read = await api.get("/api/admin/all-doctors").set("atoken", token);
  assert.equal(read.status, 200);
  assert.equal(read.body.success, true);
  assert.equal(read.body.doctors.length, 1);
  const doctorId = doctors[0]._id;

  const update = await api.post("/api/admin/update-doctor").set("atoken", token)
    .send({ ...doctor, doctorId, name: "Dr Grace Hopper" });
  assert.equal(update.status, 200);
  assert.equal(update.body.success, true);
  assert.equal(update.body.doctor.name, "Dr Grace Hopper");

  const remove = await api.post("/api/admin/delete-doctor").set("atoken", token)
    .send({ doctorId });
  assert.equal(remove.status, 200);
  assert.equal(remove.body.success, true);

  const afterDelete = await api.get("/api/admin/all-doctors").set("atoken", token);
  assert.equal(afterDelete.body.doctors.length, 0);
});
