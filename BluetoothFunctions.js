import { BleManager } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';
import { decode as base64decode, encode as base64encode } from 'base-64';

// Initialize a new BLE manager instance
const manager = new BleManager();
var bledevice = null

// Function to request necessary Bluetooth permissions for Android (no-op for iOS)
export const requestBluetoothPermission = async () => {
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
export const scanAndConnect = async (setDataCallback) => {
  manager.state().then((state) => {
    if (state !== 'PoweredOn') {
      console.log('Bluetooth is not powered on');
      return;
    }

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log('Scan error:', error);
        return;
      }

      // Example logic to connect to a specific device based on name or other identifier
      if (device && device.name === 'nimble-ble') {
        console.log('Device found:', device.name);
        manager.stopDeviceScan();

        device.connect({requestMTU: 187})
          .then((device) => {
            console.log('Device connected');
            bledevice = device
            return device.discoverAllServicesAndCharacteristics();
          })
          .then((device) => {
            // Insert logic here to interact with the device, e.g., subscribe to notifications
            // This is an example to read from a characteristic
            const serviceUUID = 'b2bbc642-46da-11ed-b878-0242ac120002';
            const characteristicUUID = 'c9af9c76-46de-11ed-b878-0242ac120002';
            return device.monitorCharacteristicForService(serviceUUID, characteristicUUID, (error, characteristic) => {
                if (error) {
                    console.error('Monitoring error:', error);
                    return;
                }
                    // Characteristic value has changed
                    const data = base64decode(characteristic.value);
                    console.log('Received data:', data);
                    setDataCallback(data); // Update state or handle data as needed
                });
            })
          .then((readCharacteristic) => {
            // Use the data from the characteristic as needed
            const data = base64decode(readCharacteristic.value);
            console.log('Received data:', data);
            setDataCallback(data); // Update state or handle data as needed
          })
          .catch((error) => {
            console.error('Connection error:', error);
          });
      }
    });
  });
};

export const bleSendString = async (stringToSend) => {
  console.log('bledevice', bledevice)
  console.log('Sending', stringToSend, '...')
  try {
    // The UUIDs for the service and characteristic you want to write to
    const serviceUUID = 'b2bbc642-46da-11ed-b878-0242ac120002';
    const characteristicUUID = 'c9af9c76-46de-11ed-b878-0242ac120002';

    // Convert the string 'up' to Base64
    const dataToSend = base64encode(stringToSend);

    // Write the Base64 encoded string to the characteristic
    await bledevice.writeCharacteristicWithResponseForService(
      serviceUUID,
      characteristicUUID,
      dataToSend // The Base64 encoded data
    );

    console.log('Data sent successfully:', stringToSend);
  } catch (error) {
    console.error('Error sending data:', error);
  }
};
