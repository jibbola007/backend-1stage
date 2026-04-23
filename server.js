const express = require("express");
const cors = require("cors");

require("./models/db"); // ✅ Connects PostgreSQL database

const profileRoutes = require("./routes/profileRoutes");
const Profile = require("./models/profile");

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

app.use("/api", profileRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 3000;

Profile.sync()
  .then(() => console.log('Profile table synced'))
  .catch(err => console.error('Profile table sync error:', err));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});