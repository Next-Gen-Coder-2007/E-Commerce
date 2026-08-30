import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      console.error('[Product Service] Error: MONGO_URI is not defined');
      process.exit(1);
    }

    const conn = await mongoose.connect(mongoURI);
    console.log(`[Product Service] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Product Service] MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
