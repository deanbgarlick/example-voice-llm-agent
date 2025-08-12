import { MongoClient, Db, Collection } from 'mongodb';
import { MongoConfig } from '../types/mongo.types';

export class MongoService {
    private client: MongoClient;
    private config: MongoConfig;

    constructor(config: MongoConfig) {
        this.config = config;
        const uri = config.host.includes('mongodb+srv://')
            ? `${config.host.replace('mongodb+srv://', `mongodb+srv://${config.username}:${config.password}@`)}`
            : `mongodb://${config.username}:${config.password}@${config.host}/${config.dbName}`;
        this.client = new MongoClient(uri);
    }

    async connect(): Promise<void> {
        await this.client.connect();
    }

    async disconnect(): Promise<void> {
        await this.client.close();
    }

    getDb(): Db {
        return this.client.db(this.config.dbName);
    }

    getCollection(name: 'products' | 'orders'): Collection {
        return this.getDb().collection(this.config.collections[name]);
    }

    static async withClient<T>(
        config: MongoConfig,
        operation: (service: MongoService) => Promise<T>
    ): Promise<T> {
        const service = new MongoService(config);
        try {
            await service.connect();
            return await operation(service);
        } finally {
            await service.disconnect();
        }
    }

    static async createPersistentClient(config: MongoConfig): Promise<MongoService> {
        const service = new MongoService(config);
        await service.connect();
        return service;
    }
}
