import * as net from 'net';
import * as Bacon from 'baconjs';
import {actions} from './commands';
import {Error, EventStream} from "baconjs";

export type ClientConfig = { address?: string, port?: number, timeout?: number, debug?: boolean, community?: string };
export type Response = { version: string, category: string, community: string, command: string, dataLength: string, data, error: boolean, raw: Buffer }

export class RawSdcpClient {
    private config: ClientConfig;
    private msgId = 0;
    private actionQueue = new Bacon.Bus<{msg: Uint8Array, id: number}>();

    responses = this.actionQueue.flatMapConcat(action => this.processAction(action));

    constructor(config: ClientConfig = {}) {
        this.config = config;
    }

    getAction(command, data?) {
        return this.addActionToQueue(actions.GET, command, data);
    }

    setAction(command, data?) {
        return this.addActionToQueue(actions.SET, command, data);
    }

    private processAction({msg, id}: { msg: Uint8Array, id: number }): any {
        this.debug('Process queue, next msg', msg);
        const client = new net.Socket();
        const disconnected = Bacon.fromEvent(client, 'close').take(1);
        const errors = Bacon.mergeAll<any>(
            Bacon.fromEvent(client, 'timeout'),
            Bacon.fromEvent(client, 'error'),
            Bacon.later(this.config.timeout || 5000, {error: 'Response timeout'})
        ).flatMapError(v => v).take(1);
        const connected = Bacon.fromNodeCallback(client.connect.bind(client), this.config.port, this.config.address).take(1);

        const response = Bacon.fromEvent(client, 'data')
            .merge(errors)
            .flatMap<any>(this.parseResponse.bind(this))
            .take(1)
            .takeUntil(disconnected);

        connected.onValue(_ => {
            client.write(msg);
        });
        response.flatMapError(() => true).onValue(() => {
            client.destroy();
        });
        return response.map(value => {
            value.id = id;
            return value;
        });
    }

    private addActionToQueue(action, command, data?) {
        const msg = this.createMessageAsHex(action, command, data);
        // What follows is nasty mutate!
        this.msgId += 1;
        const currentId = this.msgId;
        setTimeout(() => {
            this.debug(`Add message id ${currentId} to queue`, {action, command, data});
            this.actionQueue.push({msg, id: currentId});
        }, 1);
        return this.responses.filter(response => response.id === currentId).take(1);
    }

    private parseResponse(value: Buffer | { error?: string } | { errno?: number }): EventStream<Response | Bacon.Error> {
        if (value && (value["error"] || value["errno"])) {
            return Bacon.once(new Bacon.Error(value));
        }
        value = value as Buffer;
        const str = value.toString('hex').toUpperCase();
        if (str.length < 20) {
            return Bacon.once(new Bacon.Error(`Unknown response ${str} (${value})`));
        }
        const version = str.substring(0, 2);
        const category = str.substring(2, 4);
        const community = str.substring(4, 12);
        const success = str.substring(12, 14);
        const command = str.substring(14, 18);
        const dataLength = str.substring(18, 20);
        const data = str.substring(20, 20 + parseInt(dataLength, 16) * 2);
        const result = {
            version,
            category,
            community,
            command,
            dataLength,
            data,
            error: success !== '01',
            raw: value
        };
        if (!result.error) {
            return Bacon.once(result);
        } else {
            return Bacon.once(new Bacon.Error(result));
        }
    }

    private createMessageAsHex(action, command, data?) {
        const VERSION = '02';
        const CATEGORY = '0A';
        const COMMUNITY = this.config.community || '534F4E59'; // Default to 'SONY'
        if (typeof command !== 'string') {
            throw new Error(`Accepts command only as String (HEX) for now, was ${typeof command}`);
        }
        if (command.length !== 4) {
            throw new Error('Command must be 4 bytes long');
        }
        if (data && typeof data !== 'string') {
            throw new Error(`Accepts data only as String (HEX) for now, was ${typeof data}`);
        }
        const dataLength = ('00' + ((data || '').length / 2)).slice(-2);

        return hexStringToBuffer([VERSION, CATEGORY, COMMUNITY, action, command, dataLength, data || ''].join(''));
    }

    private debug(msg, param) {
        if (this.config.debug) {
            console.log(`** DEBUG: ${msg}`, param);
        }
    }
}

function hexStringToBuffer(value) {
    return Buffer.from(value, 'hex');
}
