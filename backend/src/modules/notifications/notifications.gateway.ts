import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

interface NotificationPayload {
    userId: string;
    title: string;
    message: string;
    type: string;
}

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: '/notifications',
})
export class NotificationsGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server;

    private readonly logger = new Logger(NotificationsGateway.name);

    afterInit(): void {
        this.logger.log('Notifications WebSocket Gateway initialized');
    }

    handleConnection(client: Socket): void {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket): void {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    sendNotification(payload: NotificationPayload): void {
        this.server.emit('notification', payload);
    }

    sendToUser(userId: string, payload: NotificationPayload): void {
        this.server.to(userId).emit('notification', payload);
    }
}
