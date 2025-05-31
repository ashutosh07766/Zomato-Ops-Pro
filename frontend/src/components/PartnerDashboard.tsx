import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { orderApi, partnerApi } from '../services/api';
import type { Order, DeliveryPartner } from '../types';
import type { OrderStatus } from '../types';

const PartnerDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [partner, setPartner] = useState<DeliveryPartner | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [allOrders, partnerData] = await Promise.all([
                orderApi.getAll(),
                partnerApi.getAll()
            ]);
            
            // Find current partner
            const currentPartner = partnerData.find(p => p.username === user?.username);
            setPartner(currentPartner || null);

            // Filter orders assigned to current partner (including delivered ones)
            if (currentPartner) {
                const assignedOrders = allOrders.filter(order => 
                    order.assignedPartner?.id === currentPartner.id
                );
                setOrders(assignedOrders);
            } else {
                setOrders([]);
            }
            
            setError(null);
        } catch (err) {
            setError('Failed to fetch data. Please try again.');
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateAvailability = async (isAvailable: boolean) => {
        if (!partner) return;

        try {
            await partnerApi.updateAvailability(partner.id, isAvailable);
            await fetchData();
        } catch (err) {
            setError('Failed to update availability. Please try again.');
            console.error('Error updating availability:', err);
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
            case 'READY': return 'bg-orange-100 text-orange-800';
            case 'PICKED': return 'bg-blue-100 text-blue-800';
            case 'ON_ROUTE': return 'bg-purple-100 text-purple-800';
            case 'DELIVERED': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

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
                            {partner && (
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-700">Status:</span>
                                    <button
                                        onClick={() => handleUpdateAvailability(!partner.isAvailable)}
                                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                                            partner.isAvailable
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}
                                    >
                                        {partner.isAvailable ? 'Available' : 'Unavailable'}
                                    </button>
                                </div>
                            )}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                            <dd className="mt-1 text-3xl font-semibold text-gray-900">{orders.length}</dd>
                        </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <dt className="text-sm font-medium text-gray-500 truncate">Current Status</dt>
                            <dd className="mt-1 text-3xl font-semibold text-gray-900">
                                {partner?.isAvailable ? 'Available' : 'Unavailable'}
                            </dd>
                        </div>
                    </div>
                </div>

                {/* Orders List */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Order History</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dispatch Time</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Time</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {orders.map((order) => (
                                        <tr key={order.id} className={order.status === 'DELIVERED' ? 'bg-gray-50' : ''}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.orderId}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.items}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {order.dispatchTime ? new Date(order.dispatchTime).toLocaleString() : 'Not set'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {order.status === 'DELIVERED' ? new Date(order.updatedAt).toLocaleString() : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                {order.status === 'READY' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(order.id, 'PICKED')}
                                                        className="text-indigo-600 hover:text-indigo-900 mr-2"
                                                    >
                                                        Pick Up Order
                                                    </button>
                                                )}
                                                {order.status === 'PICKED' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(order.id, 'ON_ROUTE')}
                                                        className="text-indigo-600 hover:text-indigo-900 mr-2"
                                                    >
                                                        Start Delivery
                                                    </button>
                                                )}
                                                {order.status === 'ON_ROUTE' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                                                        className="text-green-600 hover:text-green-900"
                                                    >
                                                        Mark as Delivered
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PartnerDashboard; 