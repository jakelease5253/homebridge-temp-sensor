import {
  API,
  Logging,
  AccessoryPlugin,
  Service,
  CharacteristicValue,
} from 'homebridge';
import axios from 'axios';

export class TempSensorAccessory implements AccessoryPlugin {
  private readonly service: Service;
  private currentTemperature = 0;

  constructor(
    private readonly log: Logging,
    private readonly config: {
      name: string;
      apiUrl: string;
      token: string;
      nodeId: string;
      limit: number;
    },
    private readonly api: API,
  ) {
    this.log.info(`Initializing accessory: ${this.config.name}`);

    this.service = new this.api.hap.Service.TemperatureSensor(this.config.name);

    this.service.getCharacteristic(this.api.hap.Characteristic.CurrentTemperature)
      .onGet(this.handleCurrentTemperatureGet.bind(this));

    // Poll every 5 minutes
    this.pollTemperature(); // Initial
    setInterval(() => this.pollTemperature(), 5 * 60 * 1000);
  }

  handleCurrentTemperatureGet(): CharacteristicValue {
    return this.currentTemperature;
  }

  async pollTemperature(): Promise<void> {
    try {
      const response = await axios.get(this.config.apiUrl, {
        headers: {
          Authorization: `Bearer ${this.config.token}`,
        },
        params: {
          node_id: this.config.nodeId,
          limit: this.config.limit,
        },
      });

      // Replace this line with the correct path to your API's temperature value
      const temperature = response.data?.temperature;

      if (typeof temperature === 'number') {
        this.currentTemperature = temperature;
        this.service.updateCharacteristic(
          this.api.hap.Characteristic.CurrentTemperature,
          this.currentTemperature,
        );
        this.log.info(`Updated temperature: ${this.currentTemperature}°C`);
      } else {
        this.log.warn('Invalid temperature in response:', response.data);
      }
    } catch (error) {
      this.log.error('Failed to fetch temperature:', error);
    }
  }

  getServices(): Service[] {
    return [this.service];
  }
}
