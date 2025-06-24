import mongoose from "mongoose";


const ScanResultSchema = new mongoose.Schema({
  assetId: { type: String, required: true },
  scanResults: [{
    url: String,
    similarityScore: Number,
    foundAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('ScanResult', ScanResultSchema);