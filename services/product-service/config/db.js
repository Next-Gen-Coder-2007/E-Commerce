import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const onlineURI = process.env.MONGO_URI || process.env.MONGODB_URI;
    const dbName = process.env.MONGO_DB_NAME || 'products';
    const mongoURI = onlineURI && onlineURI.trim() 
      ? onlineURI.trim() 
      : `mongodb://127.0.0.1:27017/${dbName}`;

    const isLocal = mongoURI.includes('localhost') || mongoURI.includes('127.0.0.1');
    const targetLabel = isLocal ? 'Localhost MongoDB (Development)' : 'Online MongoDB (Production/Atlas)';

    const conn = await mongoose.connect(mongoURI, {
      dbName,
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Product Service] Connected to ${targetLabel} database "${conn.connection.name}" on host: ${conn.connection.host}`);

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
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.warn('[Product Service] Running in local offline mode. Ensure MongoDB is running on 127.0.0.1:27017 for persistent local storage.');
    }
  }
};

export default connectDB;
