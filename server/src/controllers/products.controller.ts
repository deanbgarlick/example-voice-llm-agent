import { Request, Response } from 'express';
import { ProductsService } from '../services/products.service';
import { ProductSearchParams } from '../types/product.types';

export class ProductsController {
  constructor(private productsService: ProductsService) {}

  getProducts = async (req: Request, res: Response): Promise<void> => {
    try {
      const searchParams: ProductSearchParams = {
        query: req.query.query as string | undefined || null,
        productId: req.query.productId as string | undefined || null,
        category: req.query.category as string | undefined || null,
        random: req.query.random === 'true',
      };

      const result = await this.productsService.getProducts(searchParams);

      if (searchParams.productId && !result) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Products API Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}
