import * as net from 'net';

const ERROR_INVALID_REQUEST = '020A534F4E59000130021003';

export class DummyServer {
  port: number;
  mocks = {};
  server: net.Server;

  constructor(callback) {
    this.server = net.createServer(socket => {
      socket.on('data', (data: Buffer) => {
        const asHex = data.toString('hex').toUpperCase();
        if (this.mocks[asHex]) {
          socket.write(this.hexStringToBuffer(this.mocks[asHex]));
        } else {
          console.log('Unknown request', asHex);
          socket.write(this.hexStringToBuffer(ERROR_INVALID_REQUEST));
        }
      });
    });

    this.server.on('error', (err) => {
      throw err;
    });

    this.server.listen(_ => {
      this.port = (this.server.address() as net.AddressInfo).port;
      callback(this);
    });
  }

  hexStringToBuffer(value) {
    return Buffer.from(value, 'hex');
  }

  mock(request, reply) {
    this.mocks[request] = reply;
  }

}
