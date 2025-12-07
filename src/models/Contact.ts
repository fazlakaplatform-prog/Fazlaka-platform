import mongoose from 'mongoose';

const AttachmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
}, { _id: false });

const ContactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  userId: {
    type: String,
    required: true,
  },
  userFirstName: {
    type: String,
    required: true,
    trim: true,
  },
  userLastName: {
    type: String,
    required: false,
    trim: true,
  },
  userImageUrl: {
    type: String,
    required: false,
  },
  attachments: [AttachmentSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// إضافة فهارس لتحسين الأداء
ContactSchema.index({ userId: 1 });
ContactSchema.index({ email: 1 });
ContactSchema.index({ createdAt: -1 });

export default mongoose.models.Contact || mongoose.model('Contact', ContactSchema);