import React from 'react';
import { useERP } from '../context/ERPContext';
import { BarChart as BarChartIcon, AlertTriangle, DollarSign, FileText, TrendingUp, Trophy, User, ArrowUpRight, ShoppingBag, ClipboardList } from 'lucide-react';

const Reports: React.FC = () => {
  const { products, orders, customers } = useERP();

  // --- EXISTING METRICS ---
  
  // 1. Inventory Status & Valuation
  const inventoryStatus = products.map(p => ({
    ...p,
    totalValue: p.price * p.stock
  }));
  const totalInventoryValue = inventoryStatus.reduce((acc, curr) => acc + curr.totalValue, 0);

  // 2. Low Stock
  const lowStockItems = products.filter(p => p.stock <= p.reorder_level);

  // 3. Today's Sales
  const today = new Date().toDateString();
  const todaysOrders = orders.filter(o => new Date(o.date).toDateString() === today);
  const todaysSalesTotal = todaysOrders.reduce((acc, o) => acc + o.total, 0);

  // --- NEW ADVANCED FEATURES ---

  // 4. Total Revenue from Confirmed Orders (Confirmed, Shipped, Delivered)
  const confirmedRevenue = orders
    .filter(o => ['confirmed', 'shipped', 'delivered'].includes(o.status))
    .reduce((acc, o) => acc + o.total, 0);

  // 5. Top 3 Best-selling Products
  const productSales: Record<string, number> = {};
  orders.filter(o => o.status !== 'cancelled').forEach(order => {
    order.items.forEach(item => {
        productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
    });
  });
  
  const bestSellers = Object.entries(productSales)
    .map(([id, qty]) => {
        const product = products.find(p => p.id === id);
        return {
            name: product?.name || 'Unknown Product',
            qty,
            revenue: (product?.price || 0) * qty
        };
    })
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 3);

  // 6. Top Customer
  const customerSpend: Record<string, number> = {};
  orders.filter(o => o.status !== 'cancelled').forEach(order => {
    customerSpend[order.customer_id] = (customerSpend[order.customer_id] || 0) + order.total;
  });
  
  // Convert to array and sort
  const topCustomerEntry = Object.entries(customerSpend).sort((a, b) => b[1] - a[1])[0];
  const topCustomer = topCustomerEntry ? {
    ...customers.find(c => c.id === topCustomerEntry[0]),
    totalSpent: topCustomerEntry[1]
  } : null;

  // 7. Restock Recommendations
  // Logic: Suggested Order = (Reorder Level * 3) - Current Stock. Ensures ample buffer.
  const restockRecommendations = lowStockItems.map(p => {
    const targetStock = Math.max(p.reorder_level * 3, 20); // Minimum target of 20
    const suggestedOrder = Math.max(0, targetStock - p.stock);
    return {
        ...p,
        suggestedOrder,
        estimatedCost: suggestedOrder * p.price 
    };
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">System Reports & Insights</h2>
            <p className="text-slate-500 text-sm mt-1">Real-time analytics and actionable intelligence</p>
        </div>
        <div className="text-sm text-slate-400 font-mono">
            {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
             <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-100 rounded-lg text-emerald-600">
                    <DollarSign size={20} />
                </div>
                <span className="text-xs font-medium bg-emerald-50 text-emerald-700 px-2 py-1 rounded">Net</span>
             </div>
             <h3 className="text-slate-500 text-sm font-medium">Confirmed Revenue</h3>
             <p className="text-2xl font-bold text-slate-900 mt-1">${confirmedRevenue.toFixed(2)}</p>
             <p className="text-xs text-slate-400 mt-2">All finalized orders</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
             <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-amber-100 rounded-lg text-amber-600">
                    <Trophy size={20} />
                </div>
                <span className="text-xs font-medium bg-amber-50 text-amber-700 px-2 py-1 rounded">VIP</span>
             </div>
             <h3 className="text-slate-500 text-sm font-medium">Top Customer</h3>
             {topCustomer ? (
                 <>
                    <p className="text-xl font-bold text-slate-900 mt-1 truncate" title={topCustomer.name}>{topCustomer.name}</p>
                    <p className="text-xs text-slate-400 mt-2">Total Spend: ${topCustomer.totalSpent.toFixed(2)}</p>
                 </>
             ) : <p className="text-slate-400 text-sm mt-1">No data available</p>}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
             <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                    <BarChartIcon size={20} />
                </div>
             </div>
             <h3 className="text-slate-500 text-sm font-medium">Inventory Value</h3>
             <p className="text-2xl font-bold text-slate-900 mt-1">${totalInventoryValue.toFixed(2)}</p>
             <p className="text-xs text-slate-400 mt-2">{products.length} SKUs Active</p>
          </div>

           <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
             <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600">
                    <ShoppingBag size={20} />
                </div>
                <span className="text-xs font-medium bg-indigo-50 text-indigo-700 px-2 py-1 rounded">Today</span>
             </div>
             <h3 className="text-slate-500 text-sm font-medium">Daily Sales</h3>
             <p className="text-2xl font-bold text-slate-900 mt-1">${todaysSalesTotal.toFixed(2)}</p>
             <p className="text-xs text-slate-400 mt-2">{todaysOrders.length} Orders Placed</p>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Restock Recommendations */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="text-red-500" size={20} />
                    <h3 className="text-lg font-bold text-slate-800">Smart Restock Recommendations</h3>
                </div>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">Target: 3x Reorder Level</span>
            </div>
            {restockRecommendations.length === 0 ? (
                <div className="p-10 text-center bg-slate-50 rounded-lg border border-slate-100 border-dashed">
                    <ClipboardList className="mx-auto text-slate-300 mb-2" size={32} />
                    <p className="text-slate-600 font-medium">Inventory is Healthy</p>
                    <p className="text-slate-400 text-sm">No products are below reorder levels.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-slate-500 font-medium">Product Detail</th>
                                <th className="px-4 py-3 text-center text-slate-500 font-medium">Stock Status</th>
                                <th className="px-4 py-3 text-right text-slate-500 font-medium">Recommendation</th>
                                <th className="px-4 py-3 text-right text-slate-500 font-medium">Est. Cost</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {restockRecommendations.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3">
                                        <p className="font-bold text-slate-800">{p.name}</p>
                                        <p className="text-xs text-slate-500 font-mono">{p.sku}</p>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-red-600 font-bold">{p.stock} Units</span>
                                            <span className="text-xs text-slate-400">Reorder at {p.reorder_level}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                            Order +{p.suggestedOrder}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-slate-600">
                                        ${p.estimatedCost.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>

        {/* Best Sellers */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
             <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="text-purple-500" size={20} />
                <h3 className="text-lg font-bold text-slate-800">Best Sellers</h3>
            </div>
            <div className="space-y-4">
                {bestSellers.length > 0 ? bestSellers.map((item, index) => (
                    <div key={index} className="flex items-center p-3 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">
                            {index + 1}
                        </div>
                        <div className="ml-4 flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-slate-900 truncate">{item.name}</h4>
                            <p className="text-xs text-slate-500">{item.qty} units sold</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold text-slate-900">${item.revenue.toFixed(0)}</p>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-8 text-slate-500 text-sm italic">
                        No sales data available to rank.
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Detailed Order Manifest */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-4 border-b pb-4">
            <FileText className="text-slate-500" size={20} />
            <h3 className="text-lg font-bold text-slate-800">Confirmed Order History</h3>
        </div>
         <div className="overflow-auto max-h-80">
            <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                    <tr>
                        <th className="px-4 py-2 text-left text-slate-500">Order ID</th>
                        <th className="px-4 py-2 text-left text-slate-500">Date</th>
                        <th className="px-4 py-2 text-left text-slate-500">Customer</th>
                        <th className="px-4 py-2 text-right text-slate-500">Total</th>
                        <th className="px-4 py-2 text-right text-slate-500">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {orders.filter(o => ['confirmed', 'shipped', 'delivered'].includes(o.status)).length === 0 ? (
                        <tr><td colSpan={5} className="p-4 text-center text-slate-400">No confirmed orders found.</td></tr>
                    ) : orders.filter(o => ['confirmed', 'shipped', 'delivered'].includes(o.status)).map(o => (
                        <tr key={o.order_id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-mono text-xs text-slate-600">{o.order_id}</td>
                            <td className="px-4 py-3 text-slate-500">{new Date(o.date).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-slate-900 font-medium">{o.customer_name}</td>
                            <td className="px-4 py-3 text-right font-medium">${o.total.toFixed(2)}</td>
                            <td className="px-4 py-3 text-right">
                                <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                                    o.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                    o.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                    'bg-purple-100 text-purple-700'
                                }`}>
                                    {o.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default Reports;