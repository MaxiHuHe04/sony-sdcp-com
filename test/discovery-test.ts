import * as dgram from 'dgram';
import * as discovery from '../src/discovery';


describe('Discovery', () => {
    it("should be able to receive an advertisement", () => {
        discovery;
        const sock = dgram.createSocket('udp4');
        sock.bind(() => sock.setBroadcast(true));
        const message = Buffer.alloc(2, 'Hi');
        sock.send(message, 0, message.length, 53862, "255.255.255.255", (err, bytes) => sock.close());
    });
});
