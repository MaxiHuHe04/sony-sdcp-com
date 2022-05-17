import * as Bacon from 'baconjs';
import {ClientConfig, RawSdcpClient, Response} from './raw-client';
import {actions, aspectRatio, commands, powerStatus} from './commands';

export class SdcpClient {
    rawClient: RawSdcpClient;

    constructor(config: ClientConfig) {
        this.rawClient = new RawSdcpClient(config);
    }

    setPower(on: boolean) {
        return this.rawClient.setAction(commands.SET_POWER, on ? powerStatus.START_UP : powerStatus.STANDBY)
            .flatMap(() => {
                return this.rawClient.getAction(commands.GET_STATUS_POWER)
                    .flatMap(result => Bacon.once(convertPowerStatusToString(result)));
            })
            .firstToPromise();
    }

    getPower(): Promise<string> {
        return this.rawClient.getAction(commands.GET_STATUS_POWER)
            .flatMap(result => Bacon.once(convertPowerStatusToString(result)))
            .firstToPromise();
    }

    setAspectRatio(ratio) {
        return this.rawClient.setAction(commands.ASPECT_RATIO, ratio)
            .flatMap(() => {
                return this.rawClient.getAction(commands.ASPECT_RATIO)
                    .flatMap(result => Bacon.once(convertAspectRatioToString(result)));
            })
            .firstToPromise();
    }

    getAspectRatio() {
        return this.rawClient.getAction(commands.ASPECT_RATIO)
            .flatMap(result => Bacon.once(convertAspectRatioToString(result)))
            .firstToPromise();
    }

    getAction(command, data?) {
        return this.rawClient.getAction(command, data).firstToPromise();
    }

    setAction(command, data?) {
        return this.rawClient.setAction(command, data).firstToPromise();
    }
}

function convertPowerStatusToString(result: Response) {
    switch (result.data) {
        case powerStatus.STANDBY:
            return 'OFF';
        case powerStatus.START_UP:
        case powerStatus.START_UP_LAMP:
            return 'WARMING';
        case powerStatus.POWER_ON:
            return 'ON';
        case powerStatus.COOLING:
        case powerStatus.COOLING2:
            return 'COOLING';
        default:
            return new Bacon.Error(`Unknown power status ${result.data} (${result.raw.toString('hex').toUpperCase()})`);
    }
}

function convertAspectRatioToString(result: Response) {
    const keys = Object.keys(aspectRatio);
    for (let i = 0; i < keys.length; i++) {
        if (aspectRatio[keys[i]] === result.data) {
            return keys[i];
        }
    }
    return new Bacon.Error(`Unknown aspect ratio ${result.data} (${result.raw.toString('hex').toUpperCase()})`);
}

export {commands, actions, aspectRatio, powerStatus};
