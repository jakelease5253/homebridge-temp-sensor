import { API } from 'homebridge';
import { TempSensorAccessory } from './accessory';

export = (api: API) => {
  api.registerAccessory('TempSensor', TempSensorAccessory);
};
