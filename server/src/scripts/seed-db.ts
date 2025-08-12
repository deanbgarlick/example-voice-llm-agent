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

async function seedProducts(mongoService: MongoService): Promise<void> {
  console.log('📦 Loading products from JSON file...');
  const products = await loadProducts();
  const total = products.length;
  let processed = 0;

  // Get the products collection
  const collection = mongoService.getCollection('products');

  // Process each product
  for (const product of products) {
    processed++;
    const progress = Math.round((processed / total) * 100);
    console.log(`🔄 Processing product ${processed}/${total} (${progress}%): ${product.title}`);

    // Generate embeddings if not present
    if (!product.embeddings || product.embeddings.length === 0) {
      const textToEmbed = `${product.title} ${product.description}`;
      try {
        product.embeddings = await getEmbedding(textToEmbed);
        console.log('✨ Generated embeddings');
      } catch (error) {
        console.error(`❌ Failed to generate embedding for "${product.title}":`, error);
      }
    }

    // Convert string ID to ObjectId if needed
    if (typeof product._id === 'string') {
      product._id = new ObjectId(product._id);
    }

    // Upsert the product
    const filter = product._id ? { _id: product._id } : { title: product.title };
    await collection.updateOne(filter, { $set: product }, { upsert: true });
  }

  console.log('✅ All products processed');
}

async function createSearchIndexes(mongoService: MongoService): Promise<void> {
  const db = mongoService.getDb();

  console.log('🔍 Creating search indexes...');

  // Drop existing indexes
  try {
    await db.collection('products').dropIndexes();
    console.log('🗑️ Dropped existing indexes');
  } catch (e) {
    console.log('ℹ️ No existing indexes to drop');
  }

  // Create Atlas Search index
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
  }

  // Create vector search index
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
  }
}

async function run(): Promise<void> {
  try {
    console.log('🚀 Starting database seeding process...');
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
    await seedProducts(mongoService);
    await createSearchIndexes(mongoService);

    console.log('✨ Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

// Run the seeding process
run();
