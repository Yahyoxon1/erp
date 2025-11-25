import React, { useState, useEffect } from 'react';
import { useERP } from '../context/ERPContext';
import { Search as SearchIcon, Package, ShoppingCart, Users, ArrowRight, AlertTriangle } from 'lucide-react';
import { Product, Order, Customer } from '../types';

const GlobalSearch: React.FC = () => {
  const { products, orders, customers } = useERP();
  const [query, setQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setFilteredProducts([]);
      setFilteredOrders([]);
      setFilteredCustomers([]);
      return;
    }

    const lowerQ = query.toLowerCase();

    // 1. Smart Product Search (Handle "stock below X")
    let pResults = products;
    const stockMatch = query.match(/(?:stock|quantity|inventory)\s*(?:below|<|less than)\s*(\d+)/i);
    
    if (stockMatch) {
      const threshold = parseInt(stockMatch[1]);
      pResults = pResults.filter(p => p.stock < threshold);
    } else {
      pResults = pResults.filter(p => 
        p.name.toLowerCase().includes(lowerQ) ||
        p.sku.toLowerCase().includes(lowerQ) ||
        p.category.toLowerCase().includes(lowerQ)
      );
    }
    setFilteredProducts(pResults);

    // 2. Order Search
    setFilteredOrders(orders.filter(o => 
      o.order_id.toLowerCase().includes(lowerQ) ||
      o.customer_name.toLowerCase().includes(lowerQ)
    ));

    // 3. Customer Search
    setFilteredCustomers(customers.filter(c => 
      c.name.toLowerCase().includes(lowerQ) ||
      c.company.toLowerCase().includes(lowerQ) ||
      c.email.toLowerCase().includes(lowerQ)
    ));

  }, [query, products, orders, customers]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-800">Global Search</h2>
        <p className="text-slate-500 text-sm">Search across products, customers, and orders. Try queries like "Electronics" or "Stock below 100".</p>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-lg shadow-sm"
          placeholder="Search anything..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      {query && (
        <div className="space-y-8">
          {filteredProducts.length === 0 && filteredOrders.length === 0 && filteredCustomers.length === 0 && (
            <div className="text-center py-10 text-slate-500">
                <p className="text-lg">No results found for "{query}"</p>
                <p className="text-sm">Try checking your spelling or using different keywords.</p>
            </div>
          )}

          {/* Products Results */}
          {filteredProducts.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Package className="text-indigo-600" size={20} />
                <h3 className="text-lg font-bold text-slate-800">Products ({filteredProducts.length})</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map(product => (
                  <div key={product.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="font-mono text-xs text-slate-500">{product.sku}</p>
                            <h4 className="font-bold text-slate-900">{product.name}</h4>
                        </div>
                        <span className="text-xs px-2 py-1 bg-slate-100 rounded text-slate-600">{product.category}</span>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                        <span className="font-medium text-slate-900">${product.price.toFixed(2)}</span>
                        <div className="flex items-center gap-2">
                             {product.stock <= product.reorder_level && <AlertTriangle size={16} className="text-red-500" />}
                             <span className={`text-sm ${product.stock <= product.reorder_level ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
                                {product.stock} units
                             </span>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Orders Results */}
          {filteredOrders.length > 0 && (
            <section>
               <div className="flex items-center gap-2 mb-4">
                <ShoppingCart className="text-purple-600" size={20} />
                <h3 className="text-lg font-bold text-slate-800">Orders ({filteredOrders.length})</h3>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                          <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Order ID</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Customer</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Total</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Status</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                          {filteredOrders.map(order => (
                              <tr key={order.order_id} className="hover:bg-slate-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-600">{order.order_id}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{order.customer_name}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-slate-900">${order.total.toFixed(2)}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800 capitalize">
                                        {order.status}
                                    </span>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
            </section>
          )}

          {/* Customers Results */}
          {filteredCustomers.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Users className="text-blue-600" size={20} />
                <h3 className="text-lg font-bold text-slate-800">Customers ({filteredCustomers.length})</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCustomers.map(customer => (
                    <div key={customer.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0">
                            {customer.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 truncate">{customer.name}</h4>
                            <p className="text-sm text-slate-500 truncate">{customer.company}</p>
                            <p className="text-xs text-slate-400 truncate">{customer.email}</p>
                        </div>
                    </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;