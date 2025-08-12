import { ObjectId } from 'mongodb';
import { embed } from 'ai';
import dotenv from 'dotenv';
import { openai } from '@ai-sdk/openai';
import path from 'path';
import fs from 'fs/promises';
import { MongoService } from '../services/mongo.service';
import { getMongoConfig, validateMongoConfig } from '../types/mongo.types';
import { Product } from '../types/product.types';

// Initialize environment variables
dotenv.config();

interface ProductWithEmbedding extends Product {
  embeddings?: number[];
}

interface SeedOptions {
  dryRun?: boolean;
  forceEmbeddings?: boolean;
  forceIndexes?: boolean;
}

async function getEmbedding(text: string): Promise<number[]> {
  const result = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: text
  });
  return result.embedding;
}

async function loadProducts(): Promise<ProductWithEmbedding[]> {
  const dataFilePath = path.join(__dirname, '../../data/ai_shop.products.json');
  const fileData = await fs.readFile(dataFilePath, 'utf8');
  return JSON.parse(fileData);
}

async function seedProducts(mongoService: MongoService, options: SeedOptions = {}): Promise<void> {
  console.log('📦 Loading products from JSON file...');
  const products = await loadProducts();
  const total = products.length;
  let processed = 0;
  let updated = 0;
  let skipped = 0;

  // Get the products collection
  const collection = mongoService.getCollection('products');

  // Process each product
  for (const product of products) {
    processed++;
    const progress = Math.round((processed / total) * 100);
    console.log(`🔄 Processing product ${processed}/${total} (${progress}%): ${product.title}`);

    // Convert string ID to ObjectId if needed
    if (typeof product._id === 'string') {
      product._id = new ObjectId(product._id);
    }

    // Check if product exists and needs updates
    const filter = product._id ? { _id: product._id } : { title: product.title };
    const existingProduct = await collection.findOne(filter);
    
    let needsUpdate = !existingProduct;
    let embeddingsGenerated = false;

    // Check if embeddings need to be generated
    if (options.forceEmbeddings || !existingProduct?.embeddings || existingProduct.embeddings.length === 0) {
      const textToEmbed = `${product.title} ${product.description}`;
      try {
        product.embeddings = await getEmbedding(textToEmbed);
        console.log('✨ Generated embeddings');
        embeddingsGenerated = true;
        needsUpdate = true;
      } catch (error) {
        console.error(`❌ Failed to generate embedding for "${product.title}":`, error);
      }
    }

    // Check for other changes if product exists
    if (existingProduct && !needsUpdate) {
      const changes = Object.entries(product).filter(([key, value]) => {
        return key !== '_id' && 
               key !== 'embeddings' && 
               JSON.stringify(existingProduct[key]) !== JSON.stringify(value);
      });
      
      if (changes.length > 0) {
        console.log(`📝 Changes detected: ${changes.map(([key]) => key).join(', ')}`);
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      if (options.dryRun) {
        console.log(`🔍 Would ${existingProduct ? 'update' : 'insert'} product: ${product.title}`);
        if (embeddingsGenerated) console.log('   With new embeddings');
      } else {
        await collection.updateOne(filter, { $set: product }, { upsert: true });
        console.log(`✅ ${existingProduct ? 'Updated' : 'Inserted'} product: ${product.title}`);
        updated++;
      }
    } else {
      console.log(`⏭️ Skipping unchanged product: ${product.title}`);
      skipped++;
    }
  }

  console.log(`\n📊 Summary:
    Total processed: ${processed}
    ${options.dryRun ? 'Would update' : 'Updated'}: ${updated}
    Skipped: ${skipped}
  `);

  console.log('✅ All products processed');
}

async function createSearchIndexes(mongoService: MongoService, options: SeedOptions = {}): Promise<void> {
  const db = mongoService.getDb();
  const collection = mongoService.getCollection('products');

  console.log('🔍 Checking search indexes...');

  // Get existing indexes
  const existingIndexes = await collection.listIndexes().toArray();
  const hasDefaultIndex = existingIndexes.some(idx => idx.name === 'default');
  const hasVectorIndex = existingIndexes.some(idx => idx.name === 'vector_index');

  if (options.forceIndexes) {
    console.log('🔄 Force rebuild of indexes requested');
    try {
      await collection.dropIndexes();
      console.log('🗑️ Dropped existing indexes');
    } catch (e) {
      console.log('ℹ️ No existing indexes to drop');
    }
  }

  // Create Atlas Search index if needed
  if (!hasDefaultIndex || options.forceIndexes) {
    if (options.dryRun) {
      console.log('🔍 Would create Atlas Search index');
    } else {
      try {
        await db.command({
          createSearchIndexes: 'products',
          indexes: [{
            name: 'default',
            definition: {
              mappings: {
                dynamic: true
              }
            }
          }]
        });
        console.log('✅ Created Atlas Search index');
      } catch (e) {
        console.error('❌ Failed to create search index:', e);
        if (e.message?.includes('maximum number of FTS indexes')) {
          console.log('💡 Tip: This error is common on free MongoDB Atlas tiers');
        }
      }
    }
  } else {
    console.log('✓ Atlas Search index already exists');
  }

  // Create vector search index if needed
  if (!hasVectorIndex || options.forceIndexes) {
    if (options.dryRun) {
      console.log('🔍 Would create vector search index');
    } else {
      try {
        await db.command({
          createSearchIndexes: 'products',
          indexes: [{
            name: 'vector_index',
            type: 'vectorSearch',
            definition: {
              fields: [{
                type: 'vector',
                numDimensions: 1536,
                path: 'embeddings',
                similarity: 'cosine'
              }]
            }
          }]
        });
        console.log('✅ Created vector search index');
      } catch (e) {
        console.error('❌ Failed to create vector index:', e);
        if (e.message?.includes('maximum number of FTS indexes')) {
          console.log('💡 Tip: This error is common on free MongoDB Atlas tiers');
        }
      }
    }
  } else {
    console.log('✓ Vector search index already exists');
  }
}

async function run(): Promise<void> {
  try {
    // Parse command line arguments
    const options: SeedOptions = {
      dryRun: process.argv.includes('--dry-run'),
      forceEmbeddings: process.argv.includes('--force-embeddings'),
      forceIndexes: process.argv.includes('--force-indexes')
    };

    console.log('🚀 Starting database seeding process...');
    if (options.dryRun) console.log('🔍 DRY RUN MODE - No changes will be made');
    if (options.forceEmbeddings) console.log('🔄 Force regeneration of embeddings enabled');
    if (options.forceIndexes) console.log('🔄 Force recreation of indexes enabled');

    console.log('📂 Current directory:', process.cwd());
    console.log('🔑 Environment variables:', {
      MONGODB_HOST: process.env.MONGODB_HOST,
      MONGODB_USERNAME: process.env.MONGODB_USERNAME,
      MONGODB_DB_NAME: process.env.MONGODB_DB_NAME
    });

    // Initialize MongoDB connection
    const mongoConfig = getMongoConfig();
    validateMongoConfig(mongoConfig);
    const mongoService = await MongoService.createPersistentClient(mongoConfig);
    console.log('🔌 Connected to MongoDB');

    // Seed products and create indexes
    await seedProducts(mongoService, options);
    await createSearchIndexes(mongoService, options);

    console.log('✨ Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

// Run the seeding process
run();
