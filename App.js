import React, { useEffect, useState, useRef } from 'react';
import { StatusBar, StyleSheet, Text, View, Pressable, I18nManager} from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { FontAwesome5 } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { BleManager } from 'react-native-ble-plx';
import { requestBluetoothPermission, scanAndConnect, bleSendString } from './BluetoothFunctions';
import * as Updates from "expo-updates";

const manager = new BleManager();

export default function App() {
  const [bleData, setBleData] = useState(JSON.parse("{}"));
  const [isActuated, setIsActuated] = useState(false);
  const [theta, setTheta] = useState(-90); // Angle in degrees for simplicity
  const targetTheta = useRef(-90);
  const animationFrame = useRef();

  // Restart App function
  async function toggleRTL() {
    await I18nManager.forceRTL(I18nManager.isRTL ? false : true);
    await Updates.reloadAsync();
  }

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
  useEffect(() => {
    (async () => {
      const hasPermission = await requestBluetoothPermission();
      if (hasPermission) {
        // The callback function updates the state with the new data
        const handleData = (data) => {
          const jsonData = JSON.parse(data);
          setBleData(jsonData);
        };
  
        scanAndConnect(handleData);
      } else {
        console.log('No permissions to start scan');
      }
    })();
  }, []);

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
      <Svg height="50%" width="50%" viewBox="0 0 100 100">
        <Line x1={x1.toString()} y1={y1.toString()} x2={x2.toString()} y2={y2.toString()} stroke="blue" strokeWidth="2.5" />
      </Svg>
      <StatusBar style="auto" />
      <View style={styles.horizontalLayout}>
        <Pressable onPress={() => console.log('down')}>
          <FontAwesome5 name="arrow-circle-down" size={128} color="black" />
        </Pressable>
        <Text>{targetTheta.current}</Text>
        <Pressable onPress={() => bleSendString('up')}>
          <FontAwesome5 name="arrow-circle-up" size={128} color="black" />
        </Pressable>
      </View>
      <Pressable onPress={() => toggleRTL()} style={styles.restartButton}>
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
    left: 20,
    bottom: 20
  },
  horizontalLayout: {
    flexDirection: 'row', // Align children horizontally
    justifyContent: 'center', // Center children horizontally
    alignItems: 'center', // Center children vertically (in the cross axis)
  },
});
