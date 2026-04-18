const express = require("express");
const cors = require("cors");

require("./models/db"); // ✅ THIS connects MongoDB

const profileRoutes = require("./routes/profileRoutes");

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

app.use("/api", profileRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});