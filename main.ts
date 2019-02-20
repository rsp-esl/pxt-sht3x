///////////////////////////////////////////////////////////////////////////////
// SHT3X-DIS Sensirion Humidity and Temperature Sensor
// https://www.sensirion.com/en/environmental-sensors/humidity-sensors/digital-humidity-sensors-for-various-applications/
// Datasheet (PDF file)
// - http://www.mouser.com/ds/2/682/Sensirion_Humidity_Sensors_SHT3x_Datasheet_digital-971521.pdf
// - https://cdn-shop.adafruit.com/product-files/2857/Sensirion_Humidity_SHT3x_Datasheet_digital-767294.pdf
///////////////////////////////////////////////////////////////////////////////

enum SHT3xAddress {
    // 7-bit I2C addresses for SHT3X
    //% block="0x44"
    ADDR_0x44 = 0x44,  // default
    //% block="0x45"
    ADDR_0x45 = 0x45
}

/*
 * SHT3X functions
 */

//% color="#2c7f55" weight=100  
namespace SHT3X {

    /**
	* An SHT3X Device
	*/
    export class Device {
        i2c_addr: number 
        err_msg: string 
		
        /**
        * Set the address of the device 
        * @param addr the new address of this device 
        */        
        //% blockId="device_set_address" block="set the device address %addr"
        //% weight=40 blockGap=8
        //% parts="SHT3X.Device"
        public setAddress( addr : number ) : void {
            this.i2c_addr = addr         
        }
    
        /**
        * Get the address of the device
        */        
        //% blockId="device_get_address" block="get the device address"
        //% weight=10 blockGap=8
        //% parts="SHT3X.Device"
        public getAddress() : number { 
            return this.i2c_addr
        }
 
        /**
        * read data from sensor
        */        
        //% blockId="device_read_data" block="read data from sensor"
        //% weight=30 blockGap=8
        //% parts="SHT3X.Device"
        public readData() : number [] {
			let values: number[] = [0, 0]
            let wbuf = pins.createBuffer(2)
            this.err_msg = ''
			
			// single shot mode, no clock stretching
			wbuf.setNumber( NumberFormat.UInt8LE, 0, 0x2c )
            wbuf.setNumber(NumberFormat.UInt8LE, 1, 0x06)
            let result = pins.i2cWriteBuffer(this.i2c_addr, wbuf)
            if (result != 0) {
                this.err_msg = 'I2C write failed'
                return null
            }
			
			basic.pause(20)
			
			let buf = pins.i2cReadBuffer(this.i2c_addr, 6)
			if (buf.length == 6) {
				let t_hi  = buf.getNumber(NumberFormat.UInt8LE, 0)
				let t_lo  = buf.getNumber(NumberFormat.UInt8LE, 1)
				let t_crc = buf.getNumber(NumberFormat.UInt8LE, 2)
				let t_value = (t_hi << 8) | t_lo

				let h_hi  = buf.getNumber(NumberFormat.UInt8LE, 3)
				let h_lo  = buf.getNumber(NumberFormat.UInt8LE, 4)
				let h_crc = buf.getNumber(NumberFormat.UInt8LE, 5)
				let h_value = (h_hi << 8) | h_lo

				if (this.crc8(t_hi, t_lo) == t_crc) { // crc ok for temperature
					t_value  = ((t_value * 175.0) / 65535) - 45 // temperature in Celsius.
					values[0] = t_value
                } else {
                    this.err_msg = 'CRC failed (Temperature)'
					return null
				}
				
				if (this.crc8(h_hi, h_lo) == h_crc) { // crc ok for humidity
					h_value =  ((h_value * 100.0) / 65535) // relative humidity
					values[1] = h_value
				} else {
                    this.err_msg = 'CRC failed (Humidity)'
					return null
				} 
				return values
			} 
            this.err_msg = 'I2C read failed'
			return null
        }    

        /**
        * get error message
        */        
        //% blockId="device_get_error_msg" block="get error message"
        //% weight=30 blockGap=8
        //% parts="SHT3X"
        public getErrorMessage() {
            return this.err_msg
        }

		private crc8( hi_byte: number, lo_byte: number ) : number {
			let crc = 0xff
			crc ^= hi_byte
			for (let i=0; i < 8; i++) {
				crc = crc & 0x80 ? (crc << 1) ^ 0x31 : crc << 1;
			}
			crc ^= lo_byte
			for (let i=0; i < 8; i++) {
				crc = crc & 0x80 ? (crc << 1) ^ 0x31 : crc << 1;
			}
			return crc & 0xff
		}
    }
    
    /**
     * Scan I2C devices and return an array of found I2C addresses.
     */
    //% blockId="SHT3X_SCAN_DEVICES" block="SHT3X scan devices"
    //% weight=100 blockGap=8
    //% parts="SHT3X"
    export function scanDevices() : number[] {
        let buf = pins.createBuffer(1)
        buf.setNumber(NumberFormat.UInt8LE, 0xff, 0)
        let found_devices : number[] = []
        for (let addr = 1; addr <= 0x7f; addr++) {
            let result = pins.i2cWriteBuffer( addr, buf )
            if (result == 0) {
                found_devices.push( addr )
            }
        }
        return found_devices
    }    

    /**
     * Create a new SHT3X device
     */
    //% blockId="SHT3X_CREATE_DEVICE" block="SHT3X create a device"
    //% weight=100 blockGap=8
    //% parts="SHT3X"
    //% blockSetVariable=device
    export function create( addr : SHT3xAddress = SHT3xAddress.ADDR_0x44 ) : Device { 
        let device = new Device()
        device.i2c_addr = addr
        return device
    }
    
} 
///////////////////////////////////////////////////////////////////////////////
