import React, { useEffect, useState, useRef } from 'react';
import { StatusBar, StyleSheet, Text, View, Pressable, I18nManager} from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { FontAwesome5 } from '@expo/vector-icons';
import { FontAwesome6 } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { bleRequestBluetoothPermission, bleScanAndConnect, bleStartMonitoring, bleWriteString } from './BluetoothFunctions';
import * as Updates from "expo-updates";
import { useFonts } from 'expo-font';

const CounterComponent = ({ bleTargetTheta, decrement, increment }) => {
  return (
    <View style={styles.buttonContainer}>
      <Pressable
        onPress={decrement}
        style={({ pressed }) => [
          styles.button,
          pressed ? styles.buttonPressed : null,
        ]}
      >
        <FontAwesome6 name="minus" size={24} color="black" />
      </Pressable>
      <View style={styles.numberContainer}>
        <Text style={styles.number}>{bleTargetTheta}°</Text>
      </View>
      <Pressable
        onPress={increment}
        style={({ pressed }) => [
          styles.button,
          pressed ? styles.buttonPressed : null,
        ]}
      >
        <FontAwesome6 name="plus" size={24} color="black" />
      </Pressable>
    </View>
  );
};

export default function App() {
  const [bleData, setBleData] = useState(JSON.parse("{}"));
  const [isActuated, setIsActuated] = useState(false);
  const [theta, setTheta] = useState(-90); // Angle in degrees for simplicity
  const targetTheta = useRef(-90);
  const animationFrame = useRef();
  const [bleStatus, setBleStatus] = useState("BLE Not Connected");
  const bleTargetTheta = 10;
  const [fontsLoaded] = useFonts({
    'Merriweather': require('./assets/fonts/Merriweather/Merriweather-Regular.ttf'),
  });

  useEffect(() => {
    // Defines animateLine within the useEffect hook to ensure it's always in scope when used
    const animateLine = () => {
      animationFrame.current = requestAnimationFrame(() => {
        setTheta((prevTheta) => {
          const step = 0.1; // Adjust step size for smoother or faster animation
          const deltaTheta = targetTheta.current - prevTheta;
          // Calculate the next step towards the target
          return prevTheta + deltaTheta * step;
        });

        animateLine(); // Recursively calls itself to continue the animation
      });
    };

    animateLine(); // Initially starts the animation loop

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current); // Cleans up on component unmount
      }
    };
  }, []); // Ensures the effect runs once on mount

  // useEffect(() => {
  //   // Updates targetTheta periodically without directly calling animateLine
  //   const interval = setInterval(() => {
  //     targetTheta.current = -Math.random() * 90; // Sets a new target angle
  //     // No direct call to animateLine here; the animation loop is already running
  //   }, 2000);

  //   return () => clearInterval(interval);
  // }, []);

  // Initialize BLE connection and permissions
  const initiateBLEConnection = async () => {
    try {
      const hasPermission = await bleRequestBluetoothPermission();
      if (hasPermission) {
        console.log('START bleScanAndConnect()');
        const device = await bleScanAndConnect(); // This can throw if the promise is rejected
        console.log('END bleScanAndConnect()');
  
        console.log('Connected device:', device);
        setBleStatus("Connected to: " + device.name)
        if (device) {
          // Set up monitoring here using the dedicated function
          bleStartMonitoring((data) => {
            // console.log('Monitored data:', data);
            setBleData(JSON.parse(data));
          });
        }
      } else {
        console.log('No permissions to start scan');
      }
    } catch (error) {
      // Handle any errors that occurred during the BLE connection process
      console.error('BLE connection error:', error);
    }
  };

  if (bleData.rpy) {
    targetTheta.current = bleData.rpy.pitch;
    // console.log("Pitch:", bleData.rpy.pitch);
  }

  // Calculate line end points based on theta
  const radius = 100.0;
  const x1 = 5, y1 = 5;
  const radianTheta = theta * (Math.PI / 180.0); // Convert theta to radians
  const x2 = radius * Math.cos(radianTheta) + x1;
  const y2 = -radius * Math.sin(radianTheta) + y1;

  return (
    <View style={styles.container}>
      <Text style={{ fontFamily: 'Merriweather', fontSize: 14 }}>{bleStatus}</Text>
      <Svg height="50%" width="50%" viewBox="0 0 100 100">
        <Line x1={x1.toString()} y1={y1.toString()} x2={x2.toString()} y2={y2.toString()} stroke="blue" strokeWidth="2.5" />
      </Svg>
      <StatusBar style="auto" />
      <CounterComponent
        bleTargetTheta={bleTargetTheta}
        decrement={() => bleWriteString('down')}
        increment={() => bleWriteString('up')}
      />
      <Pressable style={styles.restartButton} onPress={initiateBLEConnection}>
        <Ionicons name="reload-circle" size={51} color="red" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restartButton: {
    position: 'absolute',
    right: 20,
    top: 20
  },
  horizontalLayout: {
    flexDirection: 'row', // Align children horizontally
    justifyContent: 'center', // Center children horizontally
    alignItems: 'center', // Center children vertically (in the cross axis)
    backgroundColor: '#dddddd',
  },
  fixedSizeView: {
    width: 100, // Fixed width
    height: 50, // Fixed height, adjust as necessary
    justifyContent: 'center', // Centers the text vertically
    alignItems: 'center', // Centers the text horizontally
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#dddddd',
    borderRadius: 30,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#cccccc', // Slightly darker to distinguish the button
    borderRadius: 30,
  },
  buttonPressed: {
    opacity: 0.5,
  },
  numberContainer: {
    paddingHorizontal: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#dddddd', // Same as buttonContainer for a unified look
  },
  number: {
    fontFamily: 'Merriweather',
    fontSize: 30,
  },
});
