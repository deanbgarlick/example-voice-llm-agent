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
    console.log('⚠️  This will completely remove the following collections and their indexes:');
    collections.forEach(name => console.log(`   - ${name}`));
    console.log('\nTo proceed, run with --force');
    return;
  }

  // Drop collections and all their indexes
  for (const name of collections) {
    try {
      const db = mongoService.getDb();
      const collection = mongoService.getCollection(name);
      
      try {
        // Check if collection exists
        const collectionInfo = await db.listCollections({ name: collection.collectionName }).next();
        
        if (!collectionInfo) {
          console.log(`ℹ️  Collection '${name}' does not exist, skipping...`);
          continue;
        }

        // Get document count before dropping
        const count = await collection.countDocuments();
        console.log(`📊 Found ${count} documents in '${name}'`);

        if (options.dryRun) {
          console.log(`🔍 Would drop collection '${name}' and all its indexes`);
          continue;
        }

        // Drop the entire collection (this removes all documents, indexes including Atlas Search indexes)
        await db.dropCollection(collection.collectionName);
        console.log(`✅ Dropped collection '${name}' and all its indexes`);

      } catch (error) {
        if ((error as Error).message?.includes('ns not found')) {
          console.log(`ℹ️  Collection '${name}' does not exist, skipping...`);
        } else {
          throw error;
        }
      }

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
