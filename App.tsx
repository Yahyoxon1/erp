import React from 'react';
import { HashRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { ERPProvider } from './context/ERPContext';
import Dashboard from './components/Dashboard';
import ProductList from './components/ProductList';
import CustomerList from './components/CustomerList';
import OrderList from './components/OrderList';
import Reports from './components/Reports';
import GlobalSearch from './components/GlobalSearch';
import AIAssistant from './components/AIAssistant';
import { LayoutDashboard, Package, Users, ShoppingCart, Box, PieChart, Search } from 'lucide-react';

const App: React.FC = () => {
  return (
    <ERPProvider>
      <Router>
        <div className="flex h-screen bg-slate-100 text-slate-900 font-sans">
          {/* Sidebar */}
          <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full shadow-xl z-10">
            <div className="p-6 border-b border-slate-800 flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center">
                <Box className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">NexERP</h1>
                <p className="text-xs text-slate-400">v1.0.0</p>
              </div>
            </div>
            
            <nav className="flex-1 p-4 space-y-2">
              <NavLink to="/" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                <LayoutDashboard size={20} />
                <span>Dashboard</span>
              </NavLink>

              <NavLink to="/search" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                <Search size={20} />
                <span>Search</span>
              </NavLink>
              
              <NavLink to="/products" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                <Package size={20} />
                <span>Inventory</span>
              </NavLink>
              
              <NavLink to="/customers" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                <Users size={20} />
                <span>Customers</span>
              </NavLink>
              
              <NavLink to="/orders" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                <ShoppingCart size={20} />
                <span>Orders</span>
              </NavLink>

              <NavLink to="/reports" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                <PieChart size={20} />
                <span>Reports</span>
              </NavLink>
            </nav>

            <div className="p-4 border-t border-slate-800">
               <div className="text-xs text-slate-500 text-center">
                 Initialized: NexSales Corp<br/>USD | Tax: 15%
               </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 ml-64 p-8 overflow-y-auto h-full">
            <div className="max-w-7xl mx-auto">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/search" element={<GlobalSearch />} />
                <Route path="/products" element={<ProductList />} />
                <Route path="/customers" element={<CustomerList />} />
                <Route path="/orders" element={<OrderList />} />
                <Route path="/reports" element={<Reports />} />
              </Routes>
            </div>
          </main>

          {/* AI Widget */}
          <AIAssistant />
        </div>
      </Router>
    </ERPProvider>
  );
};

export default App;