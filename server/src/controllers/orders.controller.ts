import { Request, Response } from 'express';
import { OrdersService } from '../services/orders.service';
import { OrderRequest } from '../types/order.types';

export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  createOrder = async (req: Request, res: Response): Promise<void> => {
    try {
      const orderData = req.body as OrderRequest;
      const order = await this.ordersService.createOrder(orderData);
      res.json(order);
    } catch (error) {
      console.error('Create Order API Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}
