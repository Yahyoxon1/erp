export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  reorder_level: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  priceAtTime: number;
}

export interface Order {
  order_id: string;
  customer_id: string;
  customer_name: string;
  date: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
}

export interface CompanyConfig {
  name: string;
  currency: string;
  taxRate: number;
}

export interface AppState {
  products: Product[];
  customers: Customer[];
  orders: Order[];
  config: CompanyConfig;
}