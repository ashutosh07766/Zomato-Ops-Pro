import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { orderApi, partnerApi } from '../services/api';
import type { Order, DeliveryPartner } from '../types';
import type { OrderStatus } from '../types';

const ManagerDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [partners, setPartners] = useState<DeliveryPartner[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [selectedPartner, setSelectedPartner] = useState<DeliveryPartner | null>(null);
    const [showCreateOrder, setShowCreateOrder] = useState(false);
    const [newOrder, setNewOrder] = useState({ orderId: '', items: '', prepTime: 0 });
    const [createOrderError, setCreateOrderError] = useState<string>('');
    const [showAssignModal, setShowAssignModal] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [allOrders, allPartners, availablePartners] = await Promise.all([
                orderApi.getAll(),
                partnerApi.getAll(),
                partnerApi.getAvailable()
            ]);
            
            console.log('Fetched all partners:', allPartners);
            console.log('Fetched available partners:', availablePartners);
            setOrders(allOrders);
            setPartners(allPartners);
            setError(null);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to fetch data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrder = async () => {
        if (newOrder.prepTime <= 0) {
            setError('Prep time must be greater than 0');
            return;
        }
        try {
            await orderApi.create(newOrder);
            await fetchData();
            setShowCreateOrder(false);
            setNewOrder({ orderId: '', items: '', prepTime: 15 });
        } catch (err) {
            setError('Failed to create order. Please try again.');
            console.error('Error creating order:', err);
        }
    };

    const handleAssignClick = (order: Order) => {
        setSelectedOrder(order);
        setShowAssignModal(true);
    };

    const handleAssignPartner = async () => {
        if (!selectedOrder || !selectedPartner) return;

        try {
            await orderApi.assignPartner(selectedOrder.id, selectedPartner.id);
            setShowAssignModal(false);
            setSelectedOrder(null);
            setSelectedPartner(null);
            await fetchData();
        } catch (err) {
            setError('Failed to assign partner. Please try again.');
            console.error('Error assigning partner:', err);
        }
    };

    const handleUpdateStatus = async (orderId: number, newStatus: OrderStatus) => {
        try {
            await orderApi.updateStatus(orderId, newStatus);
            await fetchData();
        } catch (err) {
            setError('Failed to update status. Please try again.');
            console.error('Error updating status:', err);
        }
    };

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case 'PREP': return 'bg-yellow-100 text-yellow-800';
            case 'PICKED': return 'bg-blue-100 text-blue-800';
            case 'ON_ROUTE': return 'bg-purple-100 text-purple-800';
            case 'DELIVERED': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredPartners = partners.filter(partner => partner.isAvailable);

    const assignedPartnerIds = orders.filter(order => order.status !== 'DELIVERED' && order.assignedPartner)
        .map(order => order.assignedPartner!.id);
    const availablePartners = partners.filter(
        partner => partner.isAvailable && !assignedPartnerIds.includes(partner.id)
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 flex items-center">
                                <div className="h-8 w-8 bg-orange-500 rounded-full flex items-center justify-center">
                                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                </div>
                                <h1 className="ml-3 text-xl font-bold text-gray-900">Zomato Ops Pro</h1>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors duration-200"
                                onClick={() => setShowCreateOrder(true)}
                            >
                                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Create Order
                            </button>
                            <div className="flex items-center space-x-3">
                                <span className="text-gray-700">Welcome, {user?.username}</span>
                                <button
                                    onClick={logout}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                                >
                                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {error && (
                    <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 animate-shake">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white overflow-hidden shadow-lg rounded-lg transform transition-all duration-300 hover:scale-105">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-orange-100 rounded-md p-3">
                                    <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                                        <dd className="text-3xl font-semibold text-gray-900">{orders.length}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow-lg rounded-lg transform transition-all duration-300 hover:scale-105">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Active Orders</dt>
                                        <dd className="text-3xl font-semibold text-gray-900">
                                            {orders.filter(o => o.status !== 'DELIVERED').length}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow-lg rounded-lg transform transition-all duration-300 hover:scale-105">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Available Partners</dt>
                                        <dd className="text-3xl font-semibold text-gray-900">
                                            {partners.filter(p => p.isAvailable).length}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Orders List */}
                <div className="bg-white shadow-lg rounded-lg mb-6 overflow-hidden">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-medium text-gray-900">Active Orders</h2>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => fetchData()}
                                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                                >
                                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Refresh
                                </button>
                            </div>
                        </div>
                        {loading ? (
                            <div className="flex justify-center items-center py-8">
                                <svg className="animate-spin h-8 w-8 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Partner</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dispatch Time</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {orders.filter(order => order.status !== 'DELIVERED').map((order) => (
                                            <tr key={order.id} className="hover:bg-gray-50 transition-colors duration-200">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.orderId}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.items}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                                        {order.status}
                                                    </span>
                                                    {order.status === 'PREP' && (
                                                        <div className="mt-1 text-xs text-gray-500">
                                                            {(() => {
                                                                const now = new Date();
                                                                const created = new Date(order.createdAt);
                                                                const prepTime = order.prepTime || 0;
                                                                const readyTime = new Date(created.getTime() + prepTime * 60000);
                                                                const remaining = Math.max(0, Math.ceil((readyTime.getTime() - now.getTime()) / 60000));
                                                                return remaining > 0 ? `Ready in ${remaining} min` : 'Ready to mark as ready';
                                                            })()}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {order.assignedPartner?.name ? order.assignedPartner.name : <span className="text-gray-400">-</span>}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {order.dispatchTime ? (
                                                        <div className="flex flex-col">
                                                            <span className="text-gray-900 font-medium">
                                                                {new Date(order.dispatchTime).toLocaleTimeString()}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                {new Date(order.dispatchTime).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    ) : 'Not set'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex space-x-2">
                                                        {(order.status === 'PREP' || order.status === 'READY') && !order.assignedPartner && (
                                                            <button
                                                                onClick={() => handleAssignClick(order)}
                                                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                            >
                                                                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                                </svg>
                                                                Assign
                                                            </button>
                                                        )}
                                                        {order.status === 'PREP' && (
                                                            <button
                                                                onClick={() => handleUpdateStatus(order.id, 'READY')}
                                                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                                            >
                                                                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                Ready
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Delivered Orders List */}
                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                    <div className="px-4 py-5 sm:p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Delivered Orders</h2>
                        {loading ? (
                            <div className="flex justify-center items-center py-8">
                                <svg className="animate-spin h-8 w-8 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Partner</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dispatch Time</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {orders.filter(order => order.status === 'DELIVERED').map((order) => (
                                            <tr key={order.id} className="hover:bg-gray-50 transition-colors duration-200">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.orderId}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.items}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {order.assignedPartner?.name || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {order.dispatchTime ? new Date(order.dispatchTime).toLocaleString() : 'Not set'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(order.updatedAt).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Create Order Modal */}
            {showCreateOrder && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Create New Order</h3>
                            <button
                                onClick={() => setShowCreateOrder(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); handleCreateOrder(); }}>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="orderId" className="block text-sm font-medium text-gray-700">
                                        Order ID
                                    </label>
                                    <input
                                        type="text"
                                        id="orderId"
                                        value={newOrder.orderId}
                                        onChange={(e) => setNewOrder({ ...newOrder, orderId: e.target.value })}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="items" className="block text-sm font-medium text-gray-700">
                                        Items
                                    </label>
                                    <input
                                        type="text"
                                        id="items"
                                        value={newOrder.items}
                                        onChange={(e) => setNewOrder({ ...newOrder, items: e.target.value })}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="prepTime" className="block text-sm font-medium text-gray-700">
                                        Prep Time (minutes)
                                    </label>
                                    <input
                                        type="number"
                                        id="prepTime"
                                        min="1"
                                        value={newOrder.prepTime}
                                        onChange={(e) => setNewOrder({ ...newOrder, prepTime: parseInt(e.target.value) || 0 })}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                                        required
                                    />
                                </div>
                            </div>
                            {createOrderError && (
                                <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm text-red-700">{createOrderError}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateOrder(false)}
                                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                                >
                                    Create Order
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Partner Modal */}
            {showAssignModal && selectedOrder && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Assign Delivery Partner</h3>
                            <button
                                onClick={() => setShowAssignModal(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="partner" className="block text-sm font-medium text-gray-700">
                                    Select Partner
                                </label>
                                <select
                                    id="partner"
                                    value={selectedPartner?.id || ''}
                                    onChange={(e) => {
                                        const partner = partners.find(p => p.id === parseInt(e.target.value));
                                        setSelectedPartner(partner || null);
                                    }}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                                >
                                    <option value="">Select a partner</option>
                                    {availablePartners.map((partner) => (
                                        <option key={partner.id} value={partner.id}>
                                            {partner.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAssignModal(false)}
                                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAssignPartner}
                                    disabled={!selectedPartner}
                                    className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                                        selectedPartner
                                            ? 'bg-orange-600 hover:bg-orange-700 focus:ring-2 focus:ring-offset-2 focus:ring-orange-500'
                                            : 'bg-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    Assign Partner
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerDashboard; 