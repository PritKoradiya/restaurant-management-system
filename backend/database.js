// config/database.js

import mongoose from 'mongoose';
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');

export const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;

        console.log('Connecting to MongoDB...');

        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 10000
        });

        console.log('MongoDB Connected');
    }
    catch(error){
        console.error('MongoDB Error:', error.message);
        throw error;
    }
};