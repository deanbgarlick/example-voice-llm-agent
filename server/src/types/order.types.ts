import { ObjectId } from 'mongodb';

export interface OrderItem {
  product: ObjectId;
  productName: string;
  quantity: number;
}

export interface OrderRequest {
  items: Array<{
    product: {
      _id: string;
      title: string;
      [key: string]: any;
    };
    quantity: number;
  }>;
  address: string;
}

export interface Order {
  items: OrderItem[];
  status: string;
  createdAt: Date;
  address: string;
}

export interface OrderResponse {
  id: string;
  items: OrderRequest['items'];
  status: string;
  createdAt: Date;
  address: string;
}
