import dgram = require('dgram');
import EventEmitter = require("events");
import * as Buffer from "buffer";
import {RemoteInfo} from "dgram";

interface Advertisement {
    id: number,
    version: number,
    category: number,
    community: string,
    productName: string,
    serialNumber: number,
    powerStatus: number,
    location: string
}

class SDAPServer extends EventEmitter {
    socket: dgram.Socket;

    constructor(port: number = 53862) {
        super();
        this.socket = dgram.createSocket('udp4');
        this.socket.on('listening', () => this.onListening());
        this.socket.on('error', err => this.onError(err));
        this.socket.on('message', (msg, remoteInfo) => this.onMessage(msg, remoteInfo));
        this.socket.bind(port);
    }

    protected onListening() {
        this.emit('listening');
    }

    protected onError(err: Error) {
        this.emit('error', err);
    }

    protected onMessage(msg: Buffer, remoteInfo: RemoteInfo) {
        const id = msg.readUIntBE(0, 2);
        if (!(id == 0xDA)) this.emit('error', new Error('Wrong ID: ' + id.toString(16)));
        const version = msg.readUIntBE(2, 1);
        const category = msg.readUIntBE(3, 1);

        const community = msg.toString('utf8', 4, 9);
        const productName = msg.toString('utf8', 8, 21);
        const serialNumber = msg.readUIntBE(20, 4);
        const powerStatus = msg.readUIntBE(24, 2);
        const location = msg.toString('utf8', 26, 26 + 24 + 1);

        const adv: Advertisement = {
            id,
            version,
            category,
            community,
            productName,
            serialNumber,
            powerStatus,
            location
        };
        this.emit('advertisement', adv);
    }

    emit(eventName: 'listening'): boolean;
    emit(eventName: 'advertisement', adv: Advertisement): boolean;
    emit(eventName: 'error', err: Error): boolean;
    emit(eventName: string | symbol, ...args: any[]): boolean {
        return super.emit(eventName, ...args);
    }

    on(eventName: 'listening', listener: () => void): this;
    on(eventName: 'advertisement', listener: (adv: Advertisement) => void): this;
    on(eventName: 'error', listener: (err: Error) => void): this
    on(eventName: string | symbol, listener: (...args: any[]) => void): this {
        return super.on(eventName, listener);
    }

    once(eventName: 'listening', listener: () => void): this;
    once(eventName: 'advertisement', listener: (adv: Advertisement) => void): this;
    once(eventName: 'error', listener: (err: Error) => void): this
    once(eventName: string | symbol, listener: (...args: any[]) => void): this {
        return super.once(eventName, listener);
    }
}

const server = dgram.createSocket('udp4');
server.on('error', err => {
    console.error(err);
    server.close();
});

server.on('message', (msg, rInfo) => {
    console.log(`Message: ${msg} from ${rInfo.address}:${rInfo.port}`);
});

server.on('listening', () => {
    const address = server.address();
    console.log(`Server listening on ${address.address} port ${address.port}`);
});

server.bind(53862);
