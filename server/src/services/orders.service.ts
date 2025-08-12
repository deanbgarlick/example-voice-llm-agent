import { Collection, ObjectId } from 'mongodb';
import { Order, OrderRequest, OrderResponse } from '../types/order.types';
import { MongoService } from './mongo.service';

export class OrdersService {
  private collection: Collection;

  constructor(private mongoService: MongoService) {
    this.collection = mongoService.getCollection('orders');
  }

  async createOrder(orderData: OrderRequest): Promise<OrderResponse> {
    const order: Order = {
      items: orderData.items.map(item => ({
        product: new ObjectId(item.product._id),
        productName: item.product.title,
        quantity: item.quantity,
      })),
      status: 'created',
      createdAt: new Date(),
      address: orderData.address,
    };

    const result = await this.collection.insertOne(order);

    if (!result.insertedId) {
      throw new Error('Failed to insert order');
    }

    return {
      id: result.insertedId.toString(),
      items: orderData.items, // Return original items with full product info
      status: order.status,
      createdAt: order.createdAt,
      address: order.address,
    };
  }
}
