export type Role = 'MANAGER' | 'PARTNER';

export interface User {
    id: number;
    username: string;
    role: Role;
}

export interface Order {
    id: number;
    orderId: string;
    items: string;
    prepTime: number;
    status: OrderStatus;
    assignedPartner?: DeliveryPartner;
    dispatchTime?: string;
    deliveryTime?: string;
    createdAt: string;
    updatedAt: string;
}

export type OrderStatus = 'PREP' | 'READY' | 'PICKED' | 'ON_ROUTE' | 'DELIVERED';

export interface DeliveryPartner {
    id: number;
    username: string;
    name: string;
    phoneNumber: string;
    isAvailable: boolean;
    eta?: number;
    createdAt: string;
    updatedAt: string;
} 