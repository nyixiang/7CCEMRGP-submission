import { BleManager } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';
import { decode as base64decode, encode as base64encode } from 'base-64';

// Initialize a new BLE manager instance
const manager = new BleManager();
const serviceUUID = 'b2bbc642-46da-11ed-b878-0242ac120002';
const characteristicUUID = 'c9af9c76-46de-11ed-b878-0242ac120002';
let nimble = null;

// Function to request necessary Bluetooth permissions for Android (no-op for iOS)
export const bleRequestBluetoothPermission = async () => {
  if (Platform.OS === 'ios') {
    // iOS permissions are handled in the project settings and plist
    return true;
  } else if (Platform.OS === 'android') {
    // Check and request necessary permissions for Android
    const apiLevel = parseInt(Platform.Version.toString(), 10);

    if (apiLevel < 31) { // For Android versions prior to Android 12 (API level 31)
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } else { // For Android 12 (API level 31) and above
      const permissions = [PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN, PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT];
      const result = await PermissionsAndroid.requestMultiple(permissions);
      return result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED &&
             result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED;
    }
  }
  return false;
};

// Function to start scanning for BLE devices and establish a connection
export const bleScanAndConnect = async () => {
  const state = await manager.state();
  if (state !== 'PoweredOn') {
    console.log('Bluetooth is not powered on');
    throw new Error('Bluetooth is not powered on');
  }

  return new Promise((resolve, reject) => {
    console.log('Scanning device');
    manager.startDeviceScan(null, null, async (error, device) => {
      if (error) {
        console.log('Scan error:', error);
        manager.stopDeviceScan();
        reject(error);
        return;
      }

      if (device && device.name === 'nimble-ble') {
        console.log('Device found:', device.name);
        manager.stopDeviceScan();
        try {
          const connectedDevice = await device.connect({requestMTU: 187});
          nimble = connectedDevice;
          console.log('Device connected:', nimble.name);
          await connectedDevice.discoverAllServicesAndCharacteristics();
          resolve(connectedDevice);
        } catch (connectionError) {
          console.error('Connection error:', connectionError);
          reject(connectionError);
        }
      } else {
        console.log('No device found');
      }
    });
  });
};

export const bleStartMonitoring = async (setDataCallback) => {
  console.log('Attemping to start monitoring')
  try {
    await nimble.monitorCharacteristicForService(serviceUUID, characteristicUUID, (error, characteristic) => {
      if (error) {
        console.error('Monitoring error:', error);
        return;
      }
      // Characteristic value has changed
      const data = base64decode(characteristic.value);
      console.log('Received data:', data);
      setDataCallback(data);
    });
  } catch (error) {
    console.error('Error setting up monitoring:', error);
  }
};


export const bleWriteString = async (stringToSend) => {
  console.log('Sending', stringToSend, '...');
  try {
    const dataToSend = base64encode(stringToSend);

    await nimble.writeCharacteristicWithResponseForService(
      serviceUUID,
      characteristicUUID,
      dataToSend
    );

    console.log('Data sent successfully:', stringToSend);
    return true;
  } catch (error) {
    console.error('Error sending data:', error);
    return false;
  }
};
