import * as dgram from 'dgram';
import {Advertisement, SDAPServer} from '../src/discovery';
import assert = require("assert");


describe('SDAP Server', () => {
    it("should be able to receive an advertisement", done => {
        const testAdv: Advertisement = {
            remote: null,
            id: 'DA',
            version: 1,
            category: 10,
            community: 'SONY',
            productName: 'Test product',
            serialNumber: 1234567,
            powerStatus: 0,
            location: 'Test location'
        };

        const sdapServer = new SDAPServer(53800);
        sdapServer.on('advertisement', adv => {
            assert.deepEqual(Object.assign(adv, {remote: null}), testAdv);
            sdapServer.close();
            done();
        });

        const sock = dgram.createSocket('udp4');
        const msg = encodeAdvertisement(testAdv);

        sock.send(msg, 0, msg.length, 53800, "127.0.0.1", () => sock.close());
    });
});

function encodeAdvertisement(adv: Advertisement): Buffer {
    const buf = Buffer.alloc(50);
    buf.write(adv.id, 0, 2, 'utf8');
    buf.writeUintBE(adv.version, 2, 1);
    buf.writeUintBE(adv.category, 3, 1);

    buf.write(adv.community, 4, 8, 'utf8');
    buf.write(adv.productName.padEnd(12, '\x00'), 8, 12, 'utf8');
    buf.writeUintBE(adv.serialNumber, 20, 4);
    buf.writeUintBE(adv.powerStatus, 24, 2);
    buf.write(adv.location.padEnd(24, '\x00'), 26, 26 + 24, 'utf8');

    return buf;
}
