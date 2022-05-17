/*
Commands acquired from Sony video projector PROTOCOL MANUAL 1st Edition.
(Shady PDF from: https://www.digis.ru/upload/iblock/f5a/VPL-VW320,%20VW520_ProtocolManual.pdf )
*/

export const actions = {
  GET: '01',
  SET: '00'
};

export const commands = {
  SET_POWER: '0130',
  CALIBRATION_PRESET: '0002',
  ASPECT_RATIO: '0020',
  INPUT: '0001',
  GET_STATUS_ERROR: '0101',
  GET_STATUS_POWER: '0102',
  GET_STATUS_LAMP_TIMER: '0113'
};

export const aspectRatio = {
  NORMAL: '0001',
  V_STRETCH: '000B',
  ZOOM_1_85: '000C',
  ZOOM_2_35: '000D',
  STRETCH: '000E',
  SQUEEZE: '000F'
};

export const powerStatus = {
  STANDBY: '0000',
  START_UP: '0001',
  START_UP_LAMP: '0002',
  POWER_ON: '0003',
  COOLING: '0004',
  COOLING2: '0005'
};
