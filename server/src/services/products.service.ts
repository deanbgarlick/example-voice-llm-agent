import { Collection, ObjectId } from 'mongodb';
import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';
import { Product, ProductSearchParams, ProductWithScore } from '../types/product.types';
import { MongoService } from './mongo.service';

export class ProductsService {
  private collection: Collection;

  constructor(private mongoService: MongoService) {
    this.collection = mongoService.getCollection('products');
  }

  private isValidObjectId(id: string): boolean {
    return ObjectId.isValid(id) && new ObjectId(id).toString() === id;
  }

  async getProducts(params: ProductSearchParams): Promise<Product[] | Product | null> {
    const { productId, query, category, random } = params;

    // Case 1: Search by product ID
    if (productId) {
      console.log(`Searching for product ID: ${productId}`);
      const filter: any = {};
      if (this.isValidObjectId(productId)) {
        filter._id = new ObjectId(productId);
      } else {
        filter._id = productId;
      }

      const result = await this.collection.findOne(filter);
      if (!result) return null;
      
      return { 
        ...result,
        _id: result._id.toString(),
        title: result.title,
        price: result.price,
        description: result.description,
        category: result.category,
        emoji: result.emoji,
        process: result.process
      } as Product;
    }

    // Case 2: Get random products
    if (random) {
      console.log('Fetching 9 random products');
      const result = await this.collection
        .aggregate([
          { $sample: { size: 9 } },
          {
            $project: {
              _id: { $toString: '$_id' },
              title: 1,
              price: 1,
              description: 1,
              category: 1,
              emoji: 1,
              process: 1,
            },
          },
        ])
        .toArray();
      return result as Product[];
    }

    // Case 3: Hybrid search (vector + full-text)
    if (query || category) {
      console.log(`Performing hybrid search for query: ${query}, category: ${category}`);
      const vectorWeight = 0.1;
      const fullTextWeight = 0.9;

      // Generate embedding for the query
      let embedding;
      if (query) {
        const { embedding: queryEmbedding } = await embed({
          model: openai.embedding('text-embedding-3-small'),
          value: query,
        });
        embedding = queryEmbedding;
      }

      const pipeline: any[] = [
        {
          $vectorSearch: {
            index: 'vector_index',
            path: 'embeddings',
            queryVector: embedding,
            numCandidates: 100,
            limit: 20,
          },
        },
        {
          $group: {
            _id: null,
            docs: { $push: '$$ROOT' },
          },
        },
        {
          $unwind: {
            path: '$docs',
            includeArrayIndex: 'rank',
          },
        },
        {
          $addFields: {
            vs_score: {
              $multiply: [
                vectorWeight,
                {
                  $divide: [1.0, { $add: ['$rank', 60] }],
                },
              ],
            },
          },
        },
        {
          $project: {
            vs_score: 1,
            _id: '$docs._id',
            title: '$docs.title',
            price: '$docs.price',
            description: '$docs.description',
            category: '$docs.category',
            emoji: '$docs.emoji',
            process: '$docs.process',
          },
        },
        {
          $unionWith: {
            coll: 'products',
            pipeline: [
              {
                $search: {
                  index: 'default',
                  text: {
                    query: query,
                    path: ['title', 'description', 'category'],
                  },
                },
              },
              { $limit: 20 },
              {
                $group: {
                  _id: null,
                  docs: { $push: '$$ROOT' },
                },
              },
              {
                $unwind: {
                  path: '$docs',
                  includeArrayIndex: 'rank',
                },
              },
              {
                $addFields: {
                  fts_score: {
                    $multiply: [
                      fullTextWeight,
                      {
                        $divide: [1.0, { $add: ['$rank', 60] }],
                      },
                    ],
                  },
                },
              },
              {
                $project: {
                  fts_score: 1,
                  _id: '$docs._id',
                  title: '$docs.title',
                  price: '$docs.price',
                  description: '$docs.description',
                  category: '$docs.category',
                  emoji: '$docs.emoji',
                  process: '$docs.process',
                },
              },
            ],
          },
        },
        {
          $group: {
            _id: '$_id',
            title: { $first: '$title' },
            price: { $first: '$price' },
            description: { $first: '$description' },
            category: { $first: '$category' },
            emoji: { $first: '$emoji' },
            process: { $first: '$process' },
            vs_score: { $max: '$vs_score' },
            fts_score: { $max: '$fts_score' },
          },
        },
        {
          $project: {
            _id: 1,
            title: 1,
            price: 1,
            description: 1,
            category: 1,
            emoji: 1,
            process: 1,
            vs_score: { $ifNull: ['$vs_score', 0] },
            fts_score: { $ifNull: ['$fts_score', 0] },
          },
        },
        {
          $addFields: {
            score: { $add: ['$fts_score', '$vs_score'] },
          },
        },
        { $sort: { score: -1 } },
        { $limit: 10 },
      ];

      const result = await this.collection.aggregate(pipeline).toArray();
      return result as ProductWithScore[];
    }

    // Case 4: Get all products (fallback)
    console.log('Fetching all products');
    const result = await this.collection.find({}).toArray();
    return result.map((product) => ({
      ...product,
      _id: product._id.toString(),
      title: product.title,
      price: product.price,
      description: product.description,
      category: product.category,
      emoji: product.emoji,
      process: product.process
    })) as Product[];
  }
}
