import React from 'react';
import { useERP } from '../context/ERPContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Users, Package, ShoppingCart, AlertTriangle, ArrowRight, Activity, ArrowUpCircle } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { config, products, customers, orders, updateProduct } = useERP();

  const lowStockProducts = products.filter(p => p.stock <= p.reorder_level);
  const totalRevenue = orders.reduce((acc, order) => acc + order.total, 0);
  
  // Prepare chart data - Aggregate revenue by date
  const revenueMap = new Map<string, number>();
  
  orders.forEach(order => {
    const dateKey = new Date(order.date).toISOString().split('T')[0];
    revenueMap.set(dateKey, (revenueMap.get(dateKey) || 0) + order.total);
  });

  const revenueData = Array.from(revenueMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-7)
    .map(([date, total]) => ({
      name: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      amount: total
    }));

  const stockData = products.slice(0, 5).map(p => ({
    name: p.name,
    stock: p.stock
  }));

  const handleRestockAll = () => {
    lowStockProducts.forEach(p => {
        // Restock logic: Set to reorder level + 25 units buffer
        updateProduct(p.id, { stock: p.reorder_level + 25 });
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">System Status: Active</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
          <div className="flex items-center space-x-2">
            <span className="font-semibold">Company:</span>
            <span>{config.name}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-semibold">Base Currency:</span>
            <span>{config.currency}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-semibold">Tax Rate:</span>
            <span>{(config.taxRate * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Revenue</p>
              <h3 className="text-2xl font-bold text-slate-900">${totalRevenue.toFixed(2)}</h3>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Active Customers</p>
              <h3 className="text-2xl font-bold text-slate-900">{customers.length}</h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Products</p>
              <h3 className="text-2xl font-bold text-slate-900">{products.length}</h3>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Orders</p>
              <h3 className="text-2xl font-bold text-slate-900">{orders.length}</h3>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <ShoppingCart className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Activity Log (Showcasing updates) */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
            <Activity className="text-indigo-600" size={20} />
            <h3 className="text-lg font-bold text-slate-800">Recent System Updates</h3>
        </div>
        <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <div>
                    <p className="font-medium text-slate-800">Price Adjustment: Wireless Mouse</p>
                    <p className="text-xs text-slate-500">Updated via Inventory Management</p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                    <span className="text-slate-400 line-through">$25.99</span>
                    <ArrowRight size={14} className="text-slate-400" />
                    <span className="font-bold text-green-600">$27.99</span>
                </div>
            </div>
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <div>
                    <p className="font-medium text-slate-800">Stock Refill: USB Cable</p>
                    <p className="text-xs text-slate-500">New Shipment Added (+50 units)</p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                    <span className="text-slate-400">290 units</span>
                    <ArrowRight size={14} className="text-slate-400" />
                    <span className="font-bold text-blue-600">340 units</span>
                </div>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <div>
                    <p className="font-medium text-slate-800">Order Status Change: ORD-100001</p>
                    <p className="text-xs text-slate-500">Customer: John Smith</p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">Confirmed</span>
                    <ArrowRight size={14} className="text-slate-400" />
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Shipped</span>
                </div>
            </div>
        </div>
      </div>

      {/* Alerts */}
      {lowStockProducts.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-500" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Low Stock Alert</h3>
              <div className="mt-1 text-sm text-red-700">
                <p>
                    {lowStockProducts.length} product{lowStockProducts.length > 1 ? 's are' : ' is'} below reorder level.
                    <span className="font-semibold ml-1 block sm:inline text-red-800 mt-1 sm:mt-0">
                        ({lowStockProducts.map(p => p.name).join(', ')})
                    </span>
                </p>
              </div>
            </div>
          </div>
          <button 
            onClick={handleRestockAll}
            className="bg-white text-red-700 hover:bg-red-100 border border-red-200 px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <ArrowUpCircle size={16} />
            Restock Now
          </button>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-80">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Stock Overview</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stockData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="stock" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-80">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Daily Revenue</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="amount" stroke="#10b981" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;