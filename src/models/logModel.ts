// src/models/Log.ts

import mongoose from 'mongoose';

const LogSchema = new mongoose.Schema({
  userId: { type: String },
  event: { type: String, required: true },
  details: { type: Object },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Log', LogSchema);
