import {
  API,
  Logging,
  AccessoryPlugin,
  Service,
  CharacteristicValue,
  HAP,
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

    // Setup GET handler for HomeKit
    this.service.getCharacteristic(this.api.hap.Characteristic.CurrentTemperature)
      .onGet(this.handleCurrentTemperatureGet.bind(this));

    // Start polling every 5 minutes
    this.pollTemperature(); // Initial poll on startup
    setInterval(() => this.pollTemperature(), 5 * 60 * 1000);
  }

  /**
   * Handler for HomeKit requesting current temperature
   */
  handleCurrentTemperatureGet(): CharacteristicValue {
    this.log.debug(`Getting current temperature: ${this.currentTemperature}°C`);
    return this.currentTemperature;
  }

  /**
   * Call your external API to fetch temperature
   */
  async pollTemperature(): Promise<void> {
    try {
      this.log.debug('Polling temperature from API...');

      const response = await axios.get(this.config.apiUrl, {
        headers: {
          Authorization: `Bearer ${this.config.token}`,
        },
        params: {
          node_id: this.config.nodeId,
          limit: this.config.limit,
        },
      });

      // 🔧 Adjust this line based on actual API structure
      const temperature = response.data?.temperature;

      if (typeof temperature === 'number') {
        this.currentTemperature = temperature;
        this.service.updateCharacteristic(
          this.api.hap.Characteristic.CurrentTemperature,
          this.currentTemperature,
        );
        this.log.info(`Updated temperature: ${this.currentTemperature}°C`);
      } else {
        this.log.warn('Temperature not found or invalid in API response', response.data);
      }
    } catch (error) {
      this.log.error('Error fetching temperature from API:', error);
    }
  }

  /**
   * Required method to return all services
   */
  getServices(): Service[] {
    return [this.service];
  }
}
