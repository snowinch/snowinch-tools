import express from "express";
import { cron } from "./lib/cron";

const app = express();
app.use(express.json());

// Mount cron endpoint
app.post("/api/cron/:job", cron.express.handler());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
