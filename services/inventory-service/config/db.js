import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      console.error('[Inventory Service] Error: MONGO_URI is not defined in environment variables');
      process.exit(1);
    }

    const dbName = process.env.MONGO_DB_NAME || 'inventory';
    const conn = await mongoose.connect(mongoURI, {
      dbName,
    });
    console.log(`[Inventory Service] MongoDB Connected to database "${conn.connection.name}" on host: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Inventory Service] MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
