import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/airtable-form-builder';

    await mongoose.connect(mongoUri);

  } catch (error) {
    process.exit(1);
  }
};

