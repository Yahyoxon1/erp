import React, { useState, useRef, useEffect } from 'react';
import { useERP } from '../context/ERPContext';
import { generateAIResponse, generateMockData } from '../services/geminiService';
import { MessageSquare, X, Send, Sparkles, Database, AlertTriangle, ArrowUpCircle, Receipt, User, FileText } from 'lucide-react';
import { Product, Customer, Order } from '../types';

interface Message {
  role: 'user' | 'ai';
  text: string;
  data?: {
    type: 'product_card' | 'customer_history' | 'daily_report';
    product?: Product;
    customer?: Customer;
    orders?: Order[];
    totalSpent?: number;
    reportData?: {
        date: string;
        ordersCount: number;
        revenue: number;
        lowStockItems: Product[];
        pendingOrdersCount: number;
        pendingOrdersTotal: number;
    }
  };
}

const AIAssistant: React.FC = () => {
  const context = useERP();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: 'Hello! I am your ERP Assistant. I can help analyze data, generate mock records, check stock levels, receive shipments, create orders, or look up customer history.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await generateAIResponse(userMsg, context);
      
      // Attempt to parse as JSON to see if it's a command
      let commandData = null;
      try {
        // Clean potential markdown code blocks if the AI adds them
        const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        if (cleanedText.startsWith('{')) {
            commandData = JSON.parse(cleanedText);
        }
      } catch (e) {
        // Not JSON, treat as normal text
      }

      if (commandData) {
        if (commandData.action === 'create_order') {
           executeOrderCommand(commandData);
        } else if (commandData.action === 'lookup_product') {
           executeLookupCommand(commandData);
        } else if (commandData.action === 'update_stock') {
           executeUpdateStockCommand(commandData);
        } else if (commandData.action === 'lookup_customer_history') {
           executeCustomerHistoryCommand(commandData);
        } else if (commandData.action === 'generate_report') {
           executeReportCommand(commandData);
        } else {
           // Fallback if action is unknown but format is JSON
           setMessages(prev => [...prev, { role: 'ai', text: responseText }]);
        }
      } else {
        setMessages(prev => [...prev, { role: 'ai', text: responseText }]);
      }

    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "Sorry, I encountered an error processing your request." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const executeLookupCommand = (data: any) => {
    const product = context.products.find(p => p.id === data.productId);
    if (product) {
        setMessages(prev => [...prev, { 
            role: 'ai', 
            text: `Here is the current stock information for ${product.name}:`,
            data: { type: 'product_card', product }
        }]);
    } else {
        setMessages(prev => [...prev, { role: 'ai', text: "I found a match, but the product ID seems invalid in the current database." }]);
    }
  };

  const executeUpdateStockCommand = (data: any) => {
    const product = context.products.find(p => p.id === data.productId);
    if (product) {
        const newStock = product.stock + data.quantity;
        context.updateProduct(product.id, { stock: newStock });
        setMessages(prev => [...prev, { 
            role: 'ai', 
            text: `✅ Inventory Updated.\nAdded ${data.quantity} units to ${product.name}.\nNew Stock Level: ${newStock}` 
        }]);
    } else {
        setMessages(prev => [...prev, { role: 'ai', text: "Could not update stock: Product not found." }]);
    }
  };

  const executeCustomerHistoryCommand = (data: any) => {
    const customer = context.customers.find(c => c.id === data.customerId);
    if (!customer) {
        setMessages(prev => [...prev, { role: 'ai', text: "I couldn't find that customer in the database." }]);
        return;
    }

    const customerOrders = context.orders.filter(o => o.customer_id === customer.id);
    const totalSpent = customerOrders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + o.total, 0);

    setMessages(prev => [...prev, {
        role: 'ai',
        text: `Found ${customerOrders.length} orders for ${customer.name}.`,
        data: {
            type: 'customer_history',
            customer,
            orders: customerOrders,
            totalSpent
        }
    }]);
  };

  const executeReportCommand = (data: any) => {
    const today = new Date().toDateString();
    const todaysOrders = context.orders.filter(o => new Date(o.date).toDateString() === today);
    const revenue = todaysOrders.reduce((sum, o) => sum + o.total, 0);
    
    const lowStockItems = context.products.filter(p => p.stock <= p.reorder_level);
    
    const pendingOrders = context.orders.filter(o => o.status === 'pending');
    const pendingOrdersTotal = pendingOrders.reduce((sum, o) => sum + o.total, 0);

    setMessages(prev => [...prev, { 
        role: 'ai', 
        text: `Generated End of Day Report for ${today}.`,
        data: {
            type: 'daily_report',
            reportData: {
                date: new Date().toLocaleDateString(),
                ordersCount: todaysOrders.length,
                revenue,
                lowStockItems,
                pendingOrdersCount: pendingOrders.length,
                pendingOrdersTotal
            }
        }
    }]);
  };

  const executeOrderCommand = (data: any) => {
    try {
        const customer = context.customers.find(c => c.id === data.customerId);
        if (!customer) throw new Error("Customer not found");

        const items = data.items.map((item: any) => {
            const product = context.products.find(p => p.id === item.productId);
            if (!product) throw new Error(`Product ${item.productId} not found`);
            return {
                productId: product.id,
                productName: product.name,
                quantity: item.quantity,
                priceAtTime: product.price
            };
        });

        const subtotal = items.reduce((acc: number, item: any) => acc + (item.priceAtTime * item.quantity), 0);
        const total = subtotal + (subtotal * context.config.taxRate);

        context.addOrder({
            order_id: `ORD-${Date.now().toString().slice(-6)}`,
            customer_id: customer.id,
            customer_name: customer.name,
            date: new Date().toISOString(),
            items: items,
            total: total,
            status: 'confirmed' // Auto-confirm AI orders
        });

        setMessages(prev => [...prev, { 
            role: 'ai', 
            text: `✅ Success! ${data.confirmationMessage}\nTotal: $${total.toFixed(2)}` 
        }]);
    } catch (err) {
        console.error(err);
        setMessages(prev => [...prev, { role: 'ai', text: "I understood the order, but failed to create it due to missing data (Customer or Product ID mismatch)." }]);
    }
  };

  const handleGenerateData = async () => {
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', text: "Generate mock data for the system." }]);
    const data = await generateMockData();
    if (data) {
        context.loadMockData(data);
        setMessages(prev => [...prev, { role: 'ai', text: `Successfully added ${data.products.length} products and ${data.customers.length} customers to the database.` }]);
    } else {
        setMessages(prev => [...prev, { role: 'ai', text: "Failed to generate data. Please check API Key." }]);
    }
    setIsLoading(false);
  };

  return (
    <>
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-transform hover:scale-105 z-40 ${isOpen ? 'hidden' : 'flex'}`}
      >
        <MessageSquare size={24} />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[550px] bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
                <Sparkles size={18} />
                <h3 className="font-bold">ERP Assistant</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-indigo-500 p-1 rounded">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-lg text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'}`}>
                  {msg.text}
                </div>
                
                {/* Render Product Card if available */}
                {msg.data?.type === 'product_card' && msg.data.product && (
                  <div className="mt-2 w-[85%] bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                          <span className="text-xs font-mono text-slate-500">{msg.data.product.sku}</span>
                          <span className="text-xs font-semibold text-slate-500">{msg.data.product.category}</span>
                      </div>
                      <div className="p-4">
                          <h4 className="font-bold text-slate-800 text-lg mb-1">{msg.data.product.name}</h4>
                          <div className="flex justify-between items-end mt-3">
                              <div>
                                  <p className="text-xs text-slate-400">Price</p>
                                  <p className="text-lg font-bold text-slate-900">${msg.data.product.price.toFixed(2)}</p>
                              </div>
                              <div className="text-right">
                                  <p className="text-xs text-slate-400">Stock Level</p>
                                  <div className="flex items-center gap-1 justify-end">
                                      {msg.data.product.stock <= msg.data.product.reorder_level && (
                                          <AlertTriangle size={14} className="text-red-500" />
                                      )}
                                      <span className={`text-lg font-bold ${
                                          msg.data.product.stock <= msg.data.product.reorder_level ? 'text-red-600' : 'text-emerald-600'
                                      }`}>
                                          {msg.data.product.stock}
                                      </span>
                                  </div>
                              </div>
                          </div>
                      </div>
                      <div className="bg-slate-50 p-2 text-center grid grid-cols-2 gap-2">
                         <button 
                            className="text-xs bg-white border border-indigo-100 text-indigo-600 py-1.5 rounded hover:bg-indigo-50 font-medium"
                            onClick={() => {
                                setInput(`Create order for John Smith: 1 ${msg.data?.product?.name}`);
                            }}
                         >
                            Order Item
                         </button>
                         <button 
                            className="text-xs bg-white border border-green-100 text-green-600 py-1.5 rounded hover:bg-green-50 font-medium flex items-center justify-center gap-1"
                            onClick={() => {
                                setInput(`Received shipment: Add 10 units to ${msg.data?.product?.name}`);
                            }}
                         >
                            <ArrowUpCircle size={12} /> Restock (+10)
                         </button>
                      </div>
                  </div>
                )}

                {/* Render Customer History Card */}
                {msg.data?.type === 'customer_history' && msg.data.customer && (
                    <div className="mt-2 w-[90%] bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex items-center gap-3">
                            <div className="p-2 bg-indigo-200 rounded-full text-indigo-700">
                                <User size={16} />
                            </div>
                            <div>
                                <h4 className="font-bold text-indigo-900 leading-tight">{msg.data.customer.name}</h4>
                                <p className="text-xs text-indigo-600">{msg.data.customer.company}</p>
                            </div>
                        </div>
                        <div className="p-4 grid grid-cols-2 gap-4 border-b border-slate-100">
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-semibold">Total Spent</p>
                                <p className="text-xl font-bold text-slate-900">${msg.data.totalSpent?.toFixed(2)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-500 uppercase font-semibold">Total Orders</p>
                                <p className="text-xl font-bold text-slate-900">{msg.data.orders?.length}</p>
                            </div>
                        </div>
                        <div className="bg-slate-50">
                            <div className="px-4 py-2 text-xs font-semibold text-slate-500 border-b border-slate-100 flex items-center gap-1">
                                <Receipt size={12} /> Recent Orders
                            </div>
                            <div className="max-h-40 overflow-y-auto">
                                {(!msg.data.orders || msg.data.orders.length === 0) ? (
                                    <p className="p-4 text-xs text-slate-400 text-center italic">No orders found.</p>
                                ) : (
                                    <table className="w-full text-xs text-left">
                                        <tbody className="divide-y divide-slate-100">
                                            {msg.data.orders.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(o => (
                                                <tr key={o.order_id} className="bg-white">
                                                    <td className="p-2 pl-4 text-slate-600">{new Date(o.date).toLocaleDateString()}</td>
                                                    <td className="p-2">
                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] capitalize ${
                                                            o.status === 'delivered' ? 'bg-green-100 text-green-700' : 
                                                            o.status === 'confirmed' ? 'bg-purple-100 text-purple-700' : 
                                                            o.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                                                        }`}>{o.status}</span>
                                                    </td>
                                                    <td className="p-2 pr-4 text-right font-medium text-slate-900">${o.total.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Render End of Day Report */}
                {msg.data?.type === 'daily_report' && msg.data.reportData && (
                    <div className="mt-2 w-[90%] bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="p-3 bg-slate-800 text-white flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <FileText size={16} />
                                <span className="font-bold text-sm">Daily Report</span>
                            </div>
                            <span className="text-xs text-slate-300">{msg.data.reportData.date}</span>
                        </div>
                        <div className="p-4 grid grid-cols-2 gap-3">
                             <div className="bg-emerald-50 p-3 rounded border border-emerald-100">
                                <p className="text-xs text-emerald-600 font-semibold uppercase">Revenue</p>
                                <p className="text-lg font-bold text-slate-800">${msg.data.reportData.revenue.toFixed(2)}</p>
                                <p className="text-xs text-slate-500">{msg.data.reportData.ordersCount} orders today</p>
                             </div>
                             <div className="bg-amber-50 p-3 rounded border border-amber-100">
                                <p className="text-xs text-amber-600 font-semibold uppercase">Pending</p>
                                <p className="text-lg font-bold text-slate-800">{msg.data.reportData.pendingOrdersCount}</p>
                                <p className="text-xs text-slate-500">${msg.data.reportData.pendingOrdersTotal.toFixed(2)} value</p>
                             </div>
                        </div>
                        <div className="px-4 pb-4">
                            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-500 uppercase">
                                <AlertTriangle size={12} /> Low Stock Alerts
                            </div>
                            {msg.data.reportData.lowStockItems.length === 0 ? (
                                <p className="text-xs text-slate-400 italic pl-5">All stock levels healthy.</p>
                            ) : (
                                <div className="space-y-1 bg-slate-50 p-2 rounded max-h-32 overflow-y-auto">
                                    {msg.data.reportData.lowStockItems.map(p => (
                                        <div key={p.id} className="flex justify-between items-center text-xs">
                                            <span className="text-slate-700 truncate max-w-[120px]">{p.name}</span>
                                            <span className="text-red-600 font-bold bg-red-50 px-1 rounded">{p.stock} left</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-200 p-3 rounded-lg rounded-bl-none animate-pulse text-xs text-slate-500">
                  Processing...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Controls */}
          <div className="p-3 bg-white border-t border-slate-200">
            {context.products.length === 0 && (
                <button 
                    onClick={handleGenerateData}
                    disabled={isLoading}
                    className="w-full mb-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs font-semibold flex items-center justify-center gap-2 hover:bg-emerald-100"
                >
                    <Database size={14} /> Populate Empty DB with Mock Data
                </button>
            )}
            <div className="flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask AI to create order or check stock..."
                className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
              <button 
                onClick={handleSend}
                disabled={isLoading}
                className="bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistant;