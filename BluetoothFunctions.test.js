import { bleRequestBluetoothPermission, bleScanAndConnect } from '../BluetoothFunctions';
import { BleManager } from 'react-native-ble-plx';
import { PermissionsAndroid } from 'react-native';

jest.mock('react-native-ble-plx', () => ({
  BleManager: jest.fn().mockImplementation(() => ({
    state: jest.fn().mockResolvedValue('PoweredOn'),
    startDeviceScan: jest.fn(),
    stopDeviceScan: jest.fn(),
    connect: jest.fn().mockResolvedValue({
      discoverAllServicesAndCharacteristics: jest.fn().mockResolvedValue(),
      name: 'Test Device'
    })
  }))
}));

describe('Bluetooth Functions', () => {
  it('requests Bluetooth permission and returns true on success', async () => {
    PermissionsAndroid.requestMultiple = jest.fn().mockResolvedValue({
      'android.permission.BLUETOOTH_SCAN': 'granted',
      'android.permission.BLUETOOTH_CONNECT': 'granted'
    });
    const permission = await bleRequestBluetoothPermission();
    expect(permission).toBe(true);
  });

  it('successfully scans and connects to a BLE device', async () => {
    const device = await bleScanAndConnect();
    expect(device.name).toBe('Test Device');
  });
});
