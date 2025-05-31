import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
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
    const [createOrderError, setCreateOrderError] = useState('');
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
            
            console.log('Fetched all partners:', allPartners); // Debug log
            console.log('Fetched available partners:', availablePartners); // Debug log
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
            await fetchData(); // Refresh data to update partner availability
        } catch (err) {
            setError('Failed to assign partner. Please try again.');
            console.error('Error assigning partner:', err);
        }
    };

    const handleUpdateStatus = async (orderId: number, newStatus: OrderStatus) => {
        try {
            await orderApi.updateStatus(orderId, newStatus);
            await fetchData(); // Refresh data after status update
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

    const filteredPartners = partners.filter(p => p.isAvailable && !orders.some(o => o.assignedPartner?.id === p.id));

    // Compute available partners (not assigned to any active order)
    const assignedPartnerIds = orders.filter(order => order.status !== 'DELIVERED' && order.assignedPartner)
        .map(order => order.assignedPartner!.id);
    const availablePartners = partners.filter(
        partner => partner.isAvailable && !assignedPartnerIds.includes(partner.id)
    );

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <h1 className="text-xl font-bold">Zomato Ops Pro</h1>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                className="ml-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                onClick={() => setShowCreateOrder(true)}
                            >
                                + Create Order
                            </button>
                            <span className="text-gray-700">Welcome, {user?.username}</span>
                            <button
                                onClick={logout}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {error && (
                    <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                            <dd className="mt-1 text-3xl font-semibold text-gray-900">{orders.length}</dd>
                        </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <dt className="text-sm font-medium text-gray-500 truncate">Active Orders</dt>
                            <dd className="mt-1 text-3xl font-semibold text-gray-900">
                                {orders.filter(o => o.status !== 'DELIVERED').length}
                            </dd>
                        </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <dt className="text-sm font-medium text-gray-500 truncate">Available Partners</dt>
                            <dd className="mt-1 text-3xl font-semibold text-gray-900">
                                {partners.filter(p => p.isAvailable).length}
                            </dd>
                        </div>
                    </div>
                </div>

                {/* Orders List */}
                <div className="bg-white shadow rounded-lg mb-6">
                    <div className="px-4 py-5 sm:p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Active Orders</h2>
                        {loading ? (
                            <div className="text-center py-4">Loading...</div>
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
                                            <tr key={order.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.orderId}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.items}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {order.assignedPartner?.name ? order.assignedPartner.name : <span className="text-gray-400">-</span>}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {order.dispatchTime ? new Date(order.dispatchTime).toLocaleString() : 'Not set'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    {(order.status === 'PREP' || order.status === 'READY') && !order.assignedPartner && (
                                                        <button
                                                            onClick={() => handleAssignClick(order)}
                                                            className="text-indigo-600 hover:text-indigo-900 mr-2"
                                                        >
                                                            Assign Partner
                                                        </button>
                                                    )}
                                                    {order.status === 'PREP' && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(order.id, 'READY')}
                                                            className="text-green-600 hover:text-green-900"
                                                        >
                                                            Mark Ready
                                                        </button>
                                                    )}
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
                <div className="bg-white shadow rounded-lg mb-6">
                    <div className="px-4 py-5 sm:p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Delivered Orders</h2>
                        {loading ? (
                            <div className="text-center py-4">Loading...</div>
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
                                            <tr key={order.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.orderId}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.items}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {order.assignedPartner?.name ? order.assignedPartner.name : <span className="text-gray-400">-</span>}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {order.dispatchTime ? new Date(order.dispatchTime).toLocaleString() : 'Not set'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {order.deliveryTime ? new Date(order.deliveryTime).toLocaleString() : 'Not set'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Create Order Modal */}
                {showCreateOrder && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
                        <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
                            <h2 className="text-xl font-bold mb-4">Create New Order</h2>
                            {createOrderError && <div className="text-red-500 mb-2">{createOrderError}</div>}
                            <label className="block mb-2">
                                Order ID
                                <input
                                    type="text"
                                    className="w-full border rounded px-2 py-1 mt-1"
                                    value={newOrder.orderId}
                                    onChange={e => setNewOrder({ ...newOrder, orderId: e.target.value })}
                                />
                            </label>
                            <label className="block mb-2">
                                Items
                                <input
                                    type="text"
                                    className="w-full border rounded px-2 py-1 mt-1"
                                    value={newOrder.items}
                                    onChange={e => setNewOrder({ ...newOrder, items: e.target.value })}
                                />
                            </label>
                            <label className="block mb-4">
                                Prep Time (min)
                                <input
                                    type="number"
                                    className="w-full border rounded px-2 py-1 mt-1"
                                    value={newOrder.prepTime}
                                    onChange={e => setNewOrder({ ...newOrder, prepTime: Number(e.target.value) })}
                                    min={1}
                                />
                            </label>
                            <div className="flex justify-end gap-2">
                                <button
                                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                                    onClick={() => {
                                        setShowCreateOrder(false);
                                        setNewOrder({ orderId: '', items: '', prepTime: 0 });
                                        setCreateOrderError('');
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                    onClick={async () => {
                                        if (!newOrder.orderId || !newOrder.items || newOrder.prepTime <= 0) {
                                            setCreateOrderError('All fields are required and prep time must be > 0.');
                                            return;
                                        }
                                        try {
                                            await orderApi.create(newOrder);
                                            setShowCreateOrder(false);
                                            setNewOrder({ orderId: '', items: '', prepTime: 0 });
                                            setCreateOrderError('');
                                            fetchData();
                                        } catch (err) {
                                            setCreateOrderError('Failed to create order.');
                                        }
                                    }}
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Partner Assignment Modal */}
                {showAssignModal && selectedOrder && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
                        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                            <div className="mt-3 text-center">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Assign Delivery Partner</h3>
                                <div className="mt-2 px-7 py-3">
                                    <p className="text-sm text-gray-500">
                                        Select a delivery partner for order {selectedOrder.orderId}
                                    </p>
                                    {availablePartners.length === 0 ? (
                                        <p className="text-red-500 text-sm mt-2">No available partners at the moment</p>
                                    ) : (
                                        <select
                                            className="w-full border rounded px-2 py-1 mt-1"
                                            value={selectedPartner?.id || ''}
                                            onChange={(e) => {
                                                const partner = availablePartners.find(p => p.id === Number(e.target.value));
                                                setSelectedPartner(partner || null);
                                            }}
                                        >
                                            <option value="">Select Partner</option>
                                            {availablePartners.length === 0 && <option disabled>No available partners</option>}
                                            {availablePartners.map(partner => (
                                                <option key={partner.id} value={partner.id}>
                                                    {partner.name} ({partner.username})
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                <div className="items-center px-4 py-3">
                                    <button
                                        onClick={handleAssignPartner}
                                        disabled={!selectedPartner}
                                        className="px-4 py-2 bg-indigo-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                                    >
                                        Assign
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowAssignModal(false);
                                            setSelectedOrder(null);
                                            setSelectedPartner(null);
                                        }}
                                        className="ml-3 px-4 py-2 bg-gray-100 text-gray-700 text-base font-medium rounded-md shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

const getNextStatus = (currentStatus: OrderStatus): OrderStatus => {
    switch (currentStatus) {
        case 'PREP': return 'READY';
        default: return currentStatus;
    }
};

export default ManagerDashboard; 