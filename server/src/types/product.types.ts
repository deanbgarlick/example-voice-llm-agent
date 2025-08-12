import { ObjectId } from 'mongodb';

export interface Product {
  _id: ObjectId | string;
  title: string;
  price: number;
  description: string;
  category: string;
  emoji: string;
  process?: string;
  embeddings?: number[];
}

export interface ProductSearchParams {
  query?: string | null;
  productId?: string | null;
  category?: string | null;
  random?: boolean;
}

export interface SearchScore {
  vs_score?: number;
  fts_score?: number;
  score?: number;
}

export interface ProductWithScore extends Product, SearchScore {}
