import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const onlineURI = process.env.MONGO_URI || process.env.MONGODB_URI;
    const dbName = process.env.MONGO_DB_NAME || 'orders';
    const mongoURI = onlineURI && onlineURI.trim() 
      ? onlineURI.trim() 
      : `mongodb://127.0.0.1:27017/${dbName}`;

    const isLocal = mongoURI.includes('localhost') || mongoURI.includes('127.0.0.1');
    const targetLabel = isLocal ? 'Localhost MongoDB (Development)' : 'Online MongoDB (Production/Atlas)';

    const conn = await mongoose.connect(mongoURI, {
      dbName,
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Order Service] Connected to ${targetLabel} database "${conn.connection.name}" on host: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Order Service] MongoDB Connection Error: ${error.message}`);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.warn('[Order Service] Running in local offline mode. Ensure MongoDB is running on 127.0.0.1:27017 for persistent local storage.');
    }
  }
};

export default connectDB;
