import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import { getMongoConfig, validateMongoConfig } from './types/mongo.types';
import { MongoService } from './services/mongo.service';
import { SessionController } from './controllers/session.controller';
import { OrdersController } from './controllers/orders.controller';
import { ProductsController } from './controllers/products.controller';
import { OrdersService } from './services/orders.service';
import { ProductsService } from './services/products.service';

// Initialize environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Debug environment
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);

// CORS debugging middleware
app.use((req, res, next) => {
  console.log('Incoming request from origin:', req.headers.origin);
  console.log('Request method:', req.method);
  console.log('Request path:', req.path);
  next();
});

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = process.env.NODE_ENV === 'production'
      ? ['https://example-voice-llm-agent.pages.dev']
      : ['http://localhost:5173', 'https://localhost:5173'];
    
    console.log('Checking origin:', origin);
    console.log('Allowed origins:', allowedOrigins);
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Origin not allowed:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// MongoDB setup
const mongoConfig = getMongoConfig();
validateMongoConfig(mongoConfig);

// Start server
async function startServer() {
  try {
    const mongoService = await MongoService.createPersistentClient(mongoConfig);
    console.log('Connected to MongoDB');

    // Initialize services with connected mongo service
    const sessionController = new SessionController();
    const ordersService = new OrdersService(mongoService);
    const productsService = new ProductsService(mongoService);
    const ordersController = new OrdersController(ordersService);
    const productsController = new ProductsController(productsService);

    // Set up endpoints
    app.post('/api/session', sessionController.createSession);
    app.post('/api/orders', ordersController.createOrder);
    app.get('/api/products', productsController.getProducts);

    // Health check endpoint
    app.get('/health', (req: express.Request, res: express.Response) => {
      res.json({ status: 'ok' });
    });

    // Start listening
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
