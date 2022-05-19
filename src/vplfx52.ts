import {SdcpClient} from "./client";

export const commands = {
    INPUT: '0001',

};

export enum FX52Command {
    INPUT = '0001',
    PICTURE_MODE = '0002',
    CONTRAST = '0010',
    BRIGHTNESS = '0011',
    COLOR = '0012',
    HUE = '0013',
    SHARPNESS = '0014',
    FREEZE = '0030',
    INPUT_C_SEL = '0032',
    LAMP_MODE = '0040',
    STATUS_POWER = '0102',

    // SIRCS
    POWER_ON = '172E',
    POWER_OFF = '172F'
}

export class FX52SdcpClient extends SdcpClient {
    getPower() {
        return this.getAction(FX52Command.STATUS_POWER);
    }

    setPower(on: boolean) {
        return this.setAction(on ? '172E' : '172F');
    }

    getAction(command: FX52Command | string, data?): Promise<any> {
        return super.getAction(command, data);
    }

    setAction(command: FX52Command | string, data?): Promise<any> {
        return super.setAction(command, data);
    }
}
