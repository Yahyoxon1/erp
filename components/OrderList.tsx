import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { Plus, Package, Truck, CheckCircle, XCircle, Eye, CheckSquare, FileText, Printer } from 'lucide-react';
import { OrderItem, Order } from '../types';

const OrderList: React.FC = () => {
  const { orders, customers, products, addOrder, updateOrderStatus, config } = useERP();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  
  // New Order State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [currentProductToAdd, setCurrentProductToAdd] = useState('');
  const [currentQty, setCurrentQty] = useState(1);

  const handleAddToCart = () => {
    const product = products.find(p => p.id === currentProductToAdd);
    if (!product) return;

    setCart(prev => {
      const existingItemIndex = prev.findIndex(item => item.productId === product.id);
      
      if (existingItemIndex >= 0) {
        // Update quantity if item already exists
        const newCart = [...prev];
        newCart[existingItemIndex] = {
            ...newCart[existingItemIndex],
            quantity: newCart[existingItemIndex].quantity + currentQty
        };
        return newCart;
      }

      // Add new item if not exists
      return [...prev, {
        productId: product.id,
        productName: product.name,
        quantity: currentQty,
        priceAtTime: product.price
      }];
    });

    setCurrentProductToAdd('');
    setCurrentQty(1);
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.priceAtTime * item.quantity), 0);
    return subtotal + (subtotal * config.taxRate);
  };

  const handleCreateOrder = () => {
    if (!selectedCustomerId || cart.length === 0) return;
    const customer = customers.find(c => c.id === selectedCustomerId);

    addOrder({
      order_id: `ORD-${Date.now().toString().slice(-6)}`,
      customer_id: selectedCustomerId,
      customer_name: customer?.name || 'Unknown',
      date: new Date().toISOString(),
      items: cart,
      total: calculateTotal(),
      status: 'pending'
    });
    setIsModalOpen(false);
    setCart([]);
    setSelectedCustomerId('');
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'confirmed': return 'text-purple-700 bg-purple-100';
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'shipped': return 'text-blue-600 bg-blue-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-amber-600 bg-amber-100';
    }
  };

  const getOrderSubtotal = (order: Order) => {
    return order.items.reduce((sum, item) => sum + (item.priceAtTime * item.quantity), 0);
  };

  const getDueDate = (dateString: string) => {
    const date = new Date(dateString);
    date.setDate(date.getDate() + 30);
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Orders</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={18} /> New Order
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
             {orders.length === 0 ? (
                <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-500 italic">
                        No orders yet.
                    </td>
                </tr>
            ) : orders.map(order => (
              <tr key={order.order_id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-sm font-mono text-slate-600">{order.order_id}</td>
                <td className="px-6 py-4 text-sm font-medium text-slate-900">{order.customer_name}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{new Date(order.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm font-bold text-slate-900">${order.total.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)} capitalize`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button title="View Details" onClick={() => setViewOrder(order)} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded">
                        <Eye size={16} />
                    </button>
                    <button title="View Invoice" onClick={() => setInvoiceOrder(order)} className="p-1 text-slate-600 hover:bg-slate-100 rounded">
                        <FileText size={16} />
                    </button>
                    {order.status === 'pending' && (
                        <button title="Confirm Order" onClick={() => updateOrderStatus(order.order_id, 'confirmed')} className="p-1 text-purple-600 hover:bg-purple-50 rounded">
                            <CheckSquare size={16} />
                        </button>
                    )}
                    {order.status === 'confirmed' && (
                        <button title="Mark Shipped" onClick={() => updateOrderStatus(order.order_id, 'shipped')} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                            <Truck size={16} />
                        </button>
                    )}
                    {order.status === 'shipped' && (
                        <button title="Mark Delivered" onClick={() => updateOrderStatus(order.order_id, 'delivered')} className="p-1 text-green-600 hover:bg-green-50 rounded">
                            <CheckCircle size={16} />
                        </button>
                    )}
                    {(order.status === 'pending' || order.status === 'confirmed') && (
                         <button title="Cancel Order" onClick={() => updateOrderStatus(order.order_id, 'cancelled')} className="p-1 text-red-600 hover:bg-red-50 rounded">
                            <XCircle size={16} />
                         </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invoice Modal */}
      {invoiceOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
                <div className="p-8 bg-white" id="invoice-content">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b pb-8 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">INVOICE</h1>
                            <p className="text-slate-500 font-mono">#{invoiceOrder.order_id.replace('ORD', 'INV')}</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-xl font-bold text-slate-800">{config.name}</h2>
                            <p className="text-slate-500 text-sm">123 Business Way</p>
                            <p className="text-slate-500 text-sm">Tech City, TC 90210</p>
                        </div>
                    </div>

                    {/* Bill To & Dates */}
                    <div className="flex justify-between mb-8">
                        <div>
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Bill To</h3>
                            <p className="font-bold text-slate-900">{invoiceOrder.customer_name}</p>
                            {(() => {
                                const customer = customers.find(c => c.id === invoiceOrder.customer_id);
                                return customer ? (
                                    <>
                                        <p className="text-slate-600">{customer.company}</p>
                                        <p className="text-slate-600">{customer.email}</p>
                                        <p className="text-slate-600">{customer.phone}</p>
                                    </>
                                ) : null;
                            })()}
                        </div>
                        <div className="text-right space-y-2">
                            <div>
                                <span className="text-slate-500 text-sm">Invoice Date:</span>
                                <span className="ml-4 font-medium text-slate-900">{new Date(invoiceOrder.date).toLocaleDateString()}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 text-sm">Due Date:</span>
                                <span className="ml-4 font-medium text-slate-900">{getDueDate(invoiceOrder.date)}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 text-sm">Terms:</span>
                                <span className="ml-4 font-medium text-slate-900">Net 30 Days</span>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <table className="w-full mb-8">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left py-3 px-4 font-bold text-slate-600 text-sm">Description</th>
                                <th className="text-right py-3 px-4 font-bold text-slate-600 text-sm">Quantity</th>
                                <th className="text-right py-3 px-4 font-bold text-slate-600 text-sm">Unit Price</th>
                                <th className="text-right py-3 px-4 font-bold text-slate-600 text-sm">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoiceOrder.items.map((item, i) => (
                                <tr key={i} className="border-b border-slate-100">
                                    <td className="py-3 px-4 text-slate-800">{item.productName}</td>
                                    <td className="py-3 px-4 text-right text-slate-600">{item.quantity}</td>
                                    <td className="py-3 px-4 text-right text-slate-600">${item.priceAtTime.toFixed(2)}</td>
                                    <td className="py-3 px-4 text-right text-slate-900 font-medium">${(item.priceAtTime * item.quantity).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div className="flex justify-end mb-8">
                        <div className="w-64 space-y-2">
                            <div className="flex justify-between text-slate-600">
                                <span>Subtotal:</span>
                                <span>${getOrderSubtotal(invoiceOrder).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Tax ({(config.taxRate * 100).toFixed(0)}%):</span>
                                <span>${(getOrderSubtotal(invoiceOrder) * config.taxRate).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold text-slate-900 border-t-2 border-slate-900 pt-2">
                                <span>Total:</span>
                                <span>${invoiceOrder.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="border-t pt-8 text-center text-slate-500 text-sm">
                        <p>Thank you for your business!</p>
                        <p>Please make checks payable to {config.name}</p>
                    </div>
                </div>
                
                {/* Actions */}
                <div className="bg-slate-50 p-4 border-t flex justify-end gap-2 rounded-b-lg">
                    <button onClick={() => window.print()} className="px-4 py-2 text-slate-700 bg-white border rounded shadow-sm hover:bg-slate-50 flex items-center gap-2">
                        <Printer size={16} /> Print
                    </button>
                    <button onClick={() => setInvoiceOrder(null)} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                        Close
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
           <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Order {viewOrder.order_id}</h3>
                        <p className="text-sm text-slate-500">{new Date(viewOrder.date).toLocaleString()}</p>
                    </div>
                    <button onClick={() => setViewOrder(null)} className="text-slate-400 hover:text-slate-600">
                        <XCircle size={24} />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Customer Info</h4>
                        <div className="bg-slate-50 p-3 rounded border border-slate-100">
                            <p className="font-medium text-slate-900">{viewOrder.customer_name}</p>
                            <p className="text-sm text-slate-600">ID: {viewOrder.customer_id}</p>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Order Status</h4>
                        <div className="flex items-center">
                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(viewOrder.status)} capitalize`}>
                                {viewOrder.status}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Order Items</h4>
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="px-4 py-2 text-left">Product</th>
                                <th className="px-4 py-2 text-right">Quantity</th>
                                <th className="px-4 py-2 text-right">Unit Price</th>
                                <th className="px-4 py-2 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {viewOrder.items.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="px-4 py-2 font-medium text-slate-900">{item.productName}</td>
                                    <td className="px-4 py-2 text-right text-slate-600">{item.quantity}</td>
                                    <td className="px-4 py-2 text-right text-slate-600">${item.priceAtTime.toFixed(2)}</td>
                                    <td className="px-4 py-2 text-right text-slate-900 font-medium">${(item.priceAtTime * item.quantity).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="border-t border-slate-200 pt-4">
                    <div className="flex justify-end space-y-2">
                        <div className="w-64 space-y-2">
                            <div className="flex justify-between text-slate-600">
                                <span>Subtotal:</span>
                                <span>${getOrderSubtotal(viewOrder).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Tax ({(config.taxRate * 100).toFixed(0)}%):</span>
                                <span>${(getOrderSubtotal(viewOrder) * config.taxRate).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold text-slate-900 border-t border-slate-200 pt-2">
                                <span>Total:</span>
                                <span>${viewOrder.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button onClick={() => setViewOrder(null)} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                        Close Details
                    </button>
                </div>
           </div>
        </div>
      )}

      {/* New Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Create New Order</h3>
            
            <div className="space-y-6">
              {/* Customer Select */}
              <div>
                <label className="block text-sm font-medium text-slate-700">Select Customer</label>
                <select 
                  className="w-full border rounded p-2 mt-1"
                  value={selectedCustomerId}
                  onChange={e => setSelectedCustomerId(e.target.value)}
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.company})</option>)}
                </select>
              </div>

              {/* Add Items */}
              <div className="bg-slate-50 p-4 rounded border border-slate-200">
                <h4 className="font-medium text-sm text-slate-700 mb-2">Add Items</h4>
                <div className="flex gap-2">
                  <select 
                    className="flex-1 border rounded p-2"
                    value={currentProductToAdd}
                    onChange={e => setCurrentProductToAdd(e.target.value)}
                  >
                    <option value="">-- Choose Product --</option>
                    {products.filter(p => p.stock > 0).map(p => (
                      <option key={p.id} value={p.id}>{p.name} (${p.price}) - Stock: {p.stock}</option>
                    ))}
                  </select>
                  <input 
                    type="number" 
                    min="1" 
                    className="w-20 border rounded p-2"
                    value={currentQty}
                    onChange={e => setCurrentQty(parseInt(e.target.value) || 1)}
                  />
                  <button 
                    onClick={handleAddToCart}
                    disabled={!currentProductToAdd}
                    className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Cart Summary */}
              {cart.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-slate-700 mb-2">Order Items</h4>
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="p-2 text-left">Product</th>
                        <th className="p-2 text-right">Qty</th>
                        <th className="p-2 text-right">Price</th>
                        <th className="p-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="p-2">{item.productName}</td>
                          <td className="p-2 text-right">{item.quantity}</td>
                          <td className="p-2 text-right">${item.priceAtTime.toFixed(2)}</td>
                          <td className="p-2 text-right">${(item.priceAtTime * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="font-bold">
                        <tr>
                            <td colSpan={3} className="p-2 text-right">Subtotal:</td>
                            <td className="p-2 text-right">${cart.reduce((s, i) => s + i.priceAtTime * i.quantity, 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td colSpan={3} className="p-2 text-right">Tax ({(config.taxRate * 100).toFixed(0)}%):</td>
                            <td className="p-2 text-right">${(cart.reduce((s, i) => s + i.priceAtTime * i.quantity, 0) * config.taxRate).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td colSpan={3} className="p-2 text-right text-lg">Total:</td>
                            <td className="p-2 text-right text-lg">${calculateTotal().toFixed(2)}</td>
                        </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
                <button 
                    onClick={handleCreateOrder} 
                    disabled={!selectedCustomerId || cart.length === 0}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                    Confirm Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderList;