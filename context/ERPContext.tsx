import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppState, CompanyConfig, Product, Customer, Order } from '../types';

const INITIAL_CONFIG: CompanyConfig = {
  name: "NexSales Corp",
  currency: "USD",
  taxRate: 0.15
};

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    sku: 'PROD001',
    name: 'Wireless Mouse',
    category: 'Electronics',
    price: 27.99, 
    stock: 145, 
    reorder_level: 20
  },
  {
    id: 'prod-002',
    sku: 'PROD002',
    name: 'USB Cable',
    category: 'Accessories',
    price: 9.99,
    stock: 340, 
    reorder_level: 50
  },
  {
    id: 'prod-003',
    sku: 'PROD003',
    name: 'Laptop Stand',
    category: 'Office',
    price: 45.50,
    stock: 12, // Updated to be below reorder_level (15) for demo
    reorder_level: 15
  },
  {
    id: 'prod-004',
    sku: 'PROD004',
    name: 'Laptop Bag',
    category: 'Accessories',
    price: 39.99,
    stock: 50,
    reorder_level: 10
  }
];

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-001',
    name: "John Smith",
    email: "john@email.com",
    phone: "+1234567890",
    company: "Tech Corp"
  },
  {
    id: 'cust-002',
    name: "Sarah Johnson",
    email: "sarah@email.com",
    phone: "+0987654321",
    company: "Design Studio"
  },
  {
    id: 'cust-003',
    name: "Mike Davis",
    email: "mike@email.com",
    phone: "+1122334455",
    company: "Retail Plus"
  }
];

const INITIAL_ORDERS: Order[] = [
  {
    order_id: 'ORD-100001',
    customer_id: 'cust-001',
    customer_name: 'John Smith',
    date: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    status: 'delivered', 
    items: [
      { productId: 'prod-001', productName: 'Wireless Mouse', quantity: 5, priceAtTime: 25.99 },
      { productId: 'prod-002', productName: 'USB Cable', quantity: 10, priceAtTime: 9.99 }
    ],
    total: 264.33
  },
  {
    order_id: 'ORD-100002',
    customer_id: 'cust-002',
    customer_name: 'Sarah Johnson',
    date: new Date().toISOString(),
    status: 'confirmed', 
    items: [
      { productId: 'prod-003', productName: 'Laptop Stand', quantity: 3, priceAtTime: 45.50 },
      { productId: 'prod-001', productName: 'Wireless Mouse', quantity: 1, priceAtTime: 27.99 }
    ],
    total: 189.16
  }
];

interface ERPContextType extends AppState {
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;
  addOrder: (order: Order) => void;
  updateOrderStatus: (id: string, status: Order['status']) => void;
  loadMockData: (data: { products: Product[], customers: Customer[] }) => void;
}

const ERPContext = createContext<ERPContextType | undefined>(undefined);

export const ERPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config] = useState<CompanyConfig>(INITIAL_CONFIG);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);

  // Initialize empty structure log on mount
  useEffect(() => {
    console.log("ERP System Initialized");
    console.log("Config:", INITIAL_CONFIG);
    console.log(`Data Loaded: ${INITIAL_PRODUCTS.length} Products, ${customers.length} Customers, ${orders.length} Orders`);
  }, []);

  const addProduct = (product: Product) => setProducts(prev => [...prev, product]);
  
  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const addCustomer = (customer: Customer) => setCustomers(prev => [...prev, customer]);
  
  const deleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
  };

  const addOrder = (order: Order) => {
    setOrders(prev => [order, ...prev]);
    
    // Deduct stock safely using functional state update and aggregating duplicates
    setProducts(prevProducts => {
        const deductions = new Map<string, number>();
        order.items.forEach(item => {
            deductions.set(item.productId, (deductions.get(item.productId) || 0) + item.quantity);
        });

        return prevProducts.map(p => {
            const deductQty = deductions.get(p.id);
            if (deductQty !== undefined) {
                return { ...p, stock: p.stock - deductQty };
            }
            return p;
        });
    });
  };

  const updateOrderStatus = (id: string, status: Order['status']) => {
    setOrders(prev => prev.map(o => o.order_id === id ? { ...o, status } : o));
  };

  const loadMockData = (data: { products: Product[], customers: Customer[] }) => {
    setProducts(prev => [...prev, ...data.products]);
    setCustomers(prev => [...prev, ...data.customers]);
  };

  return (
    <ERPContext.Provider value={{
      config,
      products,
      customers,
      orders,
      addProduct,
      updateProduct,
      deleteProduct,
      addCustomer,
      deleteCustomer,
      addOrder,
      updateOrderStatus,
      loadMockData
    }}>
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = () => {
  const context = useContext(ERPContext);
  if (!context) throw new Error("useERP must be used within ERPProvider");
  return context;
};