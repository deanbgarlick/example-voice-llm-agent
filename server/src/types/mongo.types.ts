export interface MongoConfig {
    host: string;
    username: string;
    password: string;
    dbName: string;
    collections: {
        products: string;
        orders: string;
    };
}

export function getMongoConfig(): MongoConfig {
    if (!process.env.MONGODB_HOST || !process.env.MONGODB_USERNAME || !process.env.MONGODB_PASSWORD) {
        throw new Error('MongoDB credentials are required');
    }

    return {
        host: process.env.MONGODB_HOST,
        username: process.env.MONGODB_USERNAME,
        password: process.env.MONGODB_PASSWORD,
        dbName: process.env.MONGODB_DB_NAME || 'ai_shop',
        collections: {
            products: process.env.MONGODB_PRODUCTS_COLLECTION || 'products',
            orders: process.env.MONGODB_ORDERS_COLLECTION || 'orders'
        }
    };
}

export function validateMongoConfig(config: MongoConfig): void {
    if (!config.host || !config.username || !config.password) {
        throw new Error('MongoDB host, username, and password are required');
    }
}

export function getMongoUri(config: MongoConfig): string {
    return `mongodb+srv://${config.username}:${config.password}@${config.host}/${config.dbName}?retryWrites=true&w=majority`;
}
