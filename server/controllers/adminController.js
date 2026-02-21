const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// LOGIN
exports.login = async (req, res) => {
  const { username, password } = req.body;

  const admin = await Admin.findOne({ username });
  if (!admin) return res.status(401).json({ message: "Admin not found" });

  const match = await bcrypt.compare(password, admin.password);
  if (!match) return res.status(401).json({ message: "Wrong password" });

  const token = jwt.sign({ id: admin._id }, "secretkey", {
    expiresIn: "7d",
  });

  res.json({ token, username: admin.username });
};

// CREATE NEW ADMIN (only admin can create)
exports.createAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    const hashed = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({
      username,
      password: hashed,
    });

    await newAdmin.save();

    res.status(201).json({ message: "Admin created" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
