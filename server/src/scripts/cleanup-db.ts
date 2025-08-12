import dotenv from 'dotenv';
import { MongoService } from '../services/mongo.service';
import { getMongoConfig, validateMongoConfig } from '../types/mongo.types';

// Initialize environment variables
dotenv.config();

interface CleanupOptions {
  dryRun?: boolean;
  force?: boolean;
}

async function cleanup(mongoService: MongoService, options: CleanupOptions = {}): Promise<void> {
  const collections = ['products', 'orders'] as const;
  
  if (options.dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made');
  }

  if (!options.force) {
    console.log('⚠️  This will delete all data from the following collections:');
    collections.forEach(name => console.log(`   - ${name}`));
    console.log('\nTo proceed, run with --force');
    return;
  }

  // Drop indexes and collections
  for (const name of collections) {
    const collection = mongoService.getCollection(name);
    
    try {
      // Check if collection exists
      const collectionExists = await collection.countDocuments({}, { limit: 1 }) >= 0;
      
      if (!collectionExists) {
        console.log(`ℹ️  Collection '${name}' does not exist, skipping...`);
        continue;
      }

      // Get document count
      const count = await collection.countDocuments();
      console.log(`📊 Found ${count} documents in '${name}'`);

      if (options.dryRun) {
        console.log(`🔍 Would delete all documents from '${name}'`);
        console.log(`🔍 Would drop all indexes from '${name}'`);
        continue;
      }

      // Drop indexes first
      try {
        await collection.dropIndexes();
        console.log(`✅ Dropped all indexes from '${name}'`);
      } catch (e) {
        console.log(`ℹ️  No indexes to drop in '${name}'`);
      }

      // Delete all documents
      const result = await collection.deleteMany({});
      console.log(`✅ Deleted ${result.deletedCount} documents from '${name}'`);

    } catch (error) {
      console.error(`❌ Error cleaning up '${name}':`, error);
    }
  }
}

async function run(): Promise<void> {
  try {
    // Parse command line arguments
    const options: CleanupOptions = {
      dryRun: process.argv.includes('--dry-run'),
      force: process.argv.includes('--force')
    };

    console.log('🧹 Starting database cleanup process...');

    // Initialize MongoDB connection
    const mongoConfig = getMongoConfig();
    validateMongoConfig(mongoConfig);
    const mongoService = await MongoService.createPersistentClient(mongoConfig);
    console.log('🔌 Connected to MongoDB');

    // Run cleanup
    await cleanup(mongoService, options);

    console.log('✨ Database cleanup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup process
run();
