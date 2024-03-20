import { useEffect, useState} from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Platform, PermissionsAndroid} from 'react-native';
import { BleManager } from 'react-native-ble-plx'
import { decode as base64decode } from 'base-64';
import { BarChart, LineChart, PieChart, PopulationPyramid } from "react-native-gifted-charts";

const manager = new BleManager()

var debug_txt = ""

export default function App() {
  const [bleData, setBleData] = useState("No Data Yet!");

  requestBluetoothPermission = async () => {
    if (Platform.OS === 'ios') {
      return true
    }
    if (Platform.OS === 'android' && PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION) {
      const apiLevel = parseInt(Platform.Version.toString(), 10)
  
      if (apiLevel < 31) {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
        return granted === PermissionsAndroid.RESULTS.GRANTED
      }
      if (PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN && PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT) {
        const result = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
        ])
        
        return (
          result['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
          result['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED
        )
      }
    }
  
    this.showErrorToast('Permission have not been granted')
  
    return false
  }

  const scanAndConnect = () => {
    console.log('scan and connect');
    manager.state().then((state) => {
      console.log('state is ' + state);
      if (state === 'PoweredOn') {
        console.log('state is ' + state);
        manager.startDeviceScan(null, {legacyScan: true}, (error, device) => {
          // console.log('start device scan, device:');
          // console.log(device.name);
          if (error) {
            console.log('Scan error:', error);
            return;
          }
  
          let service;
          let characteristic;
  
          if (device && device.name === 'nimble-ble') {
            console.log('Device found:', device.name);
            manager.stopDeviceScan();
  
            device
            .connect({requestMTU: 187})
            .then((device) => {
              console.log('Device connected')
              return device.discoverAllServicesAndCharacteristics();
            })
            .then((device) => {
              console.log('Services and characteristics discovered');
              return device.services();
            })
            .then((services) => {
              console.log('Found Services');
              // console.log(JSON.stringify(services, null, 2))
              service = services[2]
              return service.characteristics();
            })
            .then((characteristics) => {
              console.log('Found Characteristics');
              // console.log(JSON.stringify(characteristics, null, 2));
              characteristic = characteristics[0];
              return;
            }).then(() => {
              // console.log("Service")
              // console.log(JSON.stringify(service, null, 2))
              // console.log("Characteristic")
              // console.log(JSON.stringify(characteristic, null, 2))
              // return device.readCharacteristicForService(service.uuid, characteristic.uuid);
              characteristic.monitor((err, update) => {
                if (err) {
                  console.log(`characteristic error: ${err}`);
                  console.log(JSON.stringify(err));
                } else {
                  // console.log("Is Characteristics Readable:", update.isReadable);
                  // decoded=JSON.parse(base64decode(update.value))
                  // console.log("Data:", update.value);
                  // console.log("Decoded:", decoded.rpy);
                  data = JSON.parse(base64decode(update.value))
                  console.log(data)
                  setBleData(data)
                }
              })
            })
            .catch((error) => {
                console.error('Error:', error);
            });
        }
      });
      } else {
        console.log('Bluetooth is not powered on');
      }
    });
  }

  useEffect(() => {
    // Assuming requestBluetoothPermission is an async function that returns a boolean
    requestBluetoothPermission().then(hasPermission => {
      if (hasPermission) {
        scanAndConnect()
      } else {
        console.log('No permissions to start scan')
      }
    })
  }, [])

  if (bleData.rpy) {
    d = bleData.rpy
    data=[ {value:-d.pitch}, {value:-d.roll}, {value:-d.yaw} ]
    chart = {
      pitch: [{value:bleData.rpy.pitch}],
      roll: [{value:bleData.rpy.roll}],
      yaw: [{value:bleData.rpy.yaw}],
    }
    return (
      <View style={styles.container}>
          <BarChart
            data = {data}
            maxValue={100}
          />
          <Text>Pitch: {bleData.rpy.pitch}</Text>
          <Text>Roll: {bleData.rpy.roll}</Text>
          <Text>Yaw: {bleData.rpy.yaw}</Text>
          <StatusBar style="auto" />
      </View>
    );
  } else {
    return (
      <View style={styles.container}>
        <Text>BLE not connected</Text>
        <StatusBar style="auto" />
    </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
