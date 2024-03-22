import { useEffect, useState, useRef} from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Platform, PermissionsAndroid, Pressable, Animated, Easing} from 'react-native';
import { BleManager } from 'react-native-ble-plx'
import { decode as base64decode } from 'base-64';
import { FontAwesome5 } from '@expo/vector-icons';
import Svg, { Line } from 'react-native-svg';

const manager = new BleManager()

export default function App() {
  const [bleData, setBleData] = useState("No Data Yet!");

  const [isActuated, setIsActuated] = useState(false);
  const toggleActuation = () => setIsActuated(previousState => !previousState);

  const [theta, setTheta] = useState(-90);
  const targetTheta = useRef(0);
  const animationFrame = useRef();

  useEffect(() => {
    // Function to smoothly update the line's endpoint
    const animateLine = () => {
      animationFrame.current = requestAnimationFrame(() => {
        setTheta((prevTheta) => {
          const step = 0.01; // Adjust step size for smoother or faster animation
          const deltaTheta = targetTheta.current - prevTheta;

          // Calculate the next step towards the target
          return prevTheta + deltaTheta * step;
        });

        animateLine(); // Recursively call animateLine to continue the animation
      });
    };

    // Start the animation loop
    animateLine();

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current); // Clean up the animation frame request
      }
    };
  }, []);

  useEffect(() => {
    // Interval to update the target position every 2000 milliseconds
    const interval = setInterval(() => {
      targetTheta.current = -Math.random() * 90; // New angle in degrees
    }, 2000);

    return () => clearInterval(interval);
  }, []);


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

  scanAndConnect = () => {
    console.log('scan and connect');
    manager.state().then((state) => {
      console.log('state is ' + state);
      if (state === 'PoweredOn') {
        console.log('state is ' + state);
        manager.startDeviceScan(null, {legacyScan: true}, (error, device) => {
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
        useEffect(() => {
          // Assuming requestBluetoothPermission is an async function that returns a boolean
          requestBluetoothPermission().then(hasPermission => {
            if (hasPermission) {
              scanAndConnect()
            }
            console.log('No permissions to start scan')
          })
        }, [])
      }
    });
  }

  useEffect(() => {
    // Assuming requestBluetoothPermission is an async function that returns a boolean
    requestBluetoothPermission().then(hasPermission => {
      if (hasPermission) {
        // scanAndConnect()
      }
      console.log('No permissions to start scan')
    })
  }, [])

  // if (bleData.rpy) {
  if (true) {
    const radius = 100.0;
    const x1 = 5; // Base x-coordinate
    const y1 = 5; // Base y-coordinate
    const x2 = radius * Math.cos(theta * (Math.PI / 180.0)) + x1;
    const y2 = -radius * Math.sin(theta* (Math.PI / 180.0)) + y1;

    return (
      <View style={styles.container}>
          <Svg height="50%" width="50%" viewBox="0 0 100 100">
            <Line
              x1="0.0"
              y1="0.0"
              x2={x2.toString()}
              y2={y2.toString()}
              stroke="blue"
              strokeWidth="2.5"
            />
          </Svg>
          {/* <Text>Pitch: {bleData.rpy.pitch}</Text>
          <Text>Roll: {bleData.rpy.roll}</Text>
          <Text>Yaw: {bleData.rpy.yaw}</Text> */}
          <StatusBar style="auto" />

          <Pressable onPress={toggleActuation}>
            {isActuated? (
              <FontAwesome5 name="arrow-circle-up" size={128} color="black" />
            ) : (
              <FontAwesome5 name="arrow-circle-down" size={128} color="black" />
            )}
          </Pressable>
      </View>
    );
  } else {
    return (
      <View style={styles.container}>
        <Text>Connecting Bluetooth...</Text>
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
