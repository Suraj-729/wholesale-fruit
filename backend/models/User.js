import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  Username: { type: String, required: true, unique: true },
  Password: { type: String, required: true },
  Role: { type: String, required: true },
});

export default mongoose.model("User", userSchema);
