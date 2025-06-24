
import mongoose from 'mongoose';

const AnalyticsSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  totalUploads: { type: Number, default: 0 },
  totalLicensesSold: { type: Number, default: 0 },
  totalInfringementsDetected: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Analytics', AnalyticsSchema);
