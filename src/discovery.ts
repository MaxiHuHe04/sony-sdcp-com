import * as dgram from 'dgram';

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
