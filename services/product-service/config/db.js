import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      console.error('[Product Service] Error: MONGO_URI is not defined');
      process.exit(1);
    }

    const dbName = process.env.MONGO_DB_NAME || 'products';
    const conn = await mongoose.connect(mongoURI, {
      dbName,
    });
    console.log(`[Product Service] MongoDB Connected to database "${conn.connection.name}" on host: ${conn.connection.host}`);

    // Cleanup: Reset any legacy mock ratings for products that have 0 reviews
    try {
      await mongoose.connection.collection('products').updateMany(
        { $or: [{ numReviews: { $in: [0, null] } }, { numReviews: { $exists: false } }], rating: { $gt: 0 } },
        { $set: { rating: 0, numReviews: 0 } }
      );
    } catch (cleanErr) {
      console.warn(`[Product Service] Rating cleanup note: ${cleanErr.message}`);
    }
  } catch (error) {
    console.error(`[Product Service] MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
