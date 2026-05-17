const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const candidateRoutes = require("./routes/candidates");
const matchRoutes = require("./routes/match");
const aiRoutes = require("./routes/ai");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/candidates", candidateRoutes);
app.use("/api/match", matchRoutes);
app.use("/api/ai", aiRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Candidate Shortlister API is running ✅" });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });
