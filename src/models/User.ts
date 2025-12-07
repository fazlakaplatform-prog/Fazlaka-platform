// src/models/User.ts
import mongoose from 'mongoose';

// تعريف مخطط للبريد الإلكتروني الثانوي مع إضافة حقول التحقق
const SecondaryEmailSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationCode: {
    type: String,
  },
  verificationCodeExpiry: {
    type: Date,
  },
  // إضافة حقول التحقق بالرابط السحري
  verificationToken: {
    type: String,
  },
  verificationTokenExpiry: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  // إضافة مصفوفة للبريد الإلكتروني الثانوي
  secondaryEmails: {
    type: [SecondaryEmailSchema],
    default: [], // تعيين قيمة افتراضية
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password is required if not a Google user
    },
  },
  image: {
    type: String,
  },
  banner: {
    type: String,
  },
  bio: {
    type: String,
  },
  location: {
    type: String,
  },
  website: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  // حقل الرتبة (مستخدم، مالك، محرر)
  role: {
    type: String,
    enum: ['user', 'owner', 'editor'],
    default: 'user',
  },
  // حقل المحظور (نعم أو لا)
  banned: {
    type: Boolean,
    default: false,
  },
  verificationToken: {
    type: String,
  },
  verificationTokenExpiry: {
    type: Date,
  },
  resetToken: {
    type: String,
  },
  resetTokenExpiry: {
    type: Date,
  },
  magicToken: {
    type: String,
  },
  magicTokenExpiry: {
    type: Date,
  },
  otpCode: {
    type: String,
  },
  otpExpiry: {
    type: Date,
  },
  otpPurpose: {
    type: String,
    enum: ['login', 'register', 'reset', 'verify', 'change-password'],
  },
  otpVerified: {
    type: Boolean,
  },
  emailChangeCode: {
    type: String,
  },
  emailChangeCodeExpiry: {
    type: Date,
  },
  newEmail: {
    type: String,
  },
  googleId: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
UserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.User || mongoose.model('User', UserSchema);