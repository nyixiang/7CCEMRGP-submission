import React, { useEffect, useState, useRef } from 'react';
import { StatusBar, StyleSheet, Text, View, Pressable, I18nManager, Image, Switch, ActivityIndicator} from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { FontAwesome5 } from '@expo/vector-icons';
import { FontAwesome6 } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { bleRequestBluetoothPermission, bleScanAndConnect, bleStartMonitoring, bleWriteString } from './BluetoothFunctions';
import * as Updates from "expo-updates";
import { useFonts } from 'expo-font';

const CounterComponent = ({ bleTargetTheta, decrement, increment, isEnabled }) => {
  return (
    <View style={styles.buttonContainer}>
      {!isEnabled && (
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(255,255,255,0.5)',
            zIndex: 1, // Make sure it covers the content
          }}
        />
      )}
      <Pressable
        onPress={decrement}
        disabled={!isEnabled}
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
        disabled={!isEnabled}
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
  const [theta, setTheta] = useState(-90);
  const targetTheta = useRef(-90);
  const [bleTargetTheta, setBleTargetTheta] = useState(0);
  const animationFrame = useRef();
  const [bleStatus, setBleStatus] = useState("BLE Not Connected");
  const [isManual, setIsManual] = useState(false);

  useEffect(() => {
    const animateLine = () => {
      animationFrame.current = requestAnimationFrame(() => {
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
  
  const [fontsLoaded] = useFonts({
    'Merriweather': require('./assets/fonts/merriweather-otf/Merriweather-Regular.otf'),
  });

  if (!fontsLoaded) {
    return <ActivityIndicator size="large" />;
  }

  async function incrementTheta() {
    if (bleTargetTheta < 90) {
      try {
        const success = await bleWriteString('up');
        if (success) {
          setBleTargetTheta(prevTheta => prevTheta + 30);
        }
      } catch (error) {
        console.error('The write operation failed:', error);
      }
    }
  }

  async function decrementTheta() {
    if (bleTargetTheta > 0) {
      try {
        const success = await bleWriteString('down');
        if (success) {
          setBleTargetTheta(prevTheta => prevTheta - 30);
        }
      } catch (error) {
        console.error('The write operation failed:', error);
      }
    }
  }

  async function toggleManualSwitch() {
    try {
      const success = await bleWriteString('toggle');
      if (success) {
        setIsManual(previousState => !previousState);
      }
    } catch (error) {
      console.error('The write operation failed:', error);
    }
  }

  // Uncomment to test animation with synthetically generated data
  // useEffect(() => {
  //   // Updates targetTheta periodically without directly calling animateLine
  //   const interval = setInterval(() => {
  //     targetTheta.current = -Math.random() * 90; // Sets a new target angle
  //     console.log('Set theta:', targetTheta.current);
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
        const device = await bleScanAndConnect();
        console.log('END bleScanAndConnect()');
  
        console.log('Connected device:', device);
        setBleStatus("Connected to: " + device.name)
        if (device) {
          bleStartMonitoring((data) => {
            // console.log('Monitored data:', data);
            setBleData(JSON.parse(data));
          });

          // Reset the state of the app
          setBleTargetTheta(0);
          setIsManual(false)
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
  // const radius = 100.0;
  // const x1 = 5, y1 = 5;
  // const radianTheta = theta * (Math.PI / 180.0); // Convert theta to radians
  // const x2 = radius * Math.cos(radianTheta) + x1;
  // const y2 = -radius * Math.sin(radianTheta) + y1;

  // console.log('Theta:', theta);

  const displayTheta = -theta + 280;

  const dynamicHandStyle = {
    ...styles.hand,
    transform: [
      { translateY: -ty },
      { translateX: -tx },
      { rotate: `${displayTheta}deg` }, // Apply the dynamic rotation
      { translateY: ty },
      { translateX: tx },
    ],
  };

  return (
    <View style={styles.container}>
      <Text style={{
        fontFamily: 'Merriweather',
        fontSize: 14,
        position: 'absolute',
        top: 35,
      }}>{bleStatus}</Text>
      <View style={styles.bodyContainer}>
        <Image
          source={require('./assets/hand.png')}
          style={dynamicHandStyle}
          resizeMode="contain"
        />
        <Image
          source={require('./assets/body.png')}
          style={styles.body}
          resizeMode="contain"
        />
    </View>
      <StatusBar style="auto" />
      <View style={styles.horizontalLayout}>
        <Text style={{fontFamily: "Merriweather"}}>
          {isManual ? "Mode: Manual      " : "Mode: Automatic   "}
        </Text>
        <Switch
          onValueChange={toggleManualSwitch}
          value={isManual}
        />
      </View>
      <CounterComponent
        bleTargetTheta={bleTargetTheta}
        decrement={decrementTheta}
        increment={incrementTheta}
        isEnabled={isManual}
      />
      <Pressable
        onPress={initiateBLEConnection}
        style={({ pressed }) => [
          styles.restartButton,
          pressed ? styles.buttonPressed : null,
        ]}>
        <Ionicons name="reload-circle" size={51} color="blue"/>
      </Pressable>
    </View>
  );
}

const tx = 10;
const ty = 60;

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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fixedSizeView: {
    width: 100,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#cccccc',
    borderRadius: 30,
  },
  buttonPressed: {
    opacity: 0.5,
  },
  numberContainer: {
    paddingHorizontal: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#dddddd',
  },
  number: {
    fontFamily: 'Merriweather',
    fontSize: 30,
  },
  bodyContainer: {
    position: 'relative',
    padding: 20,
  },
  body: {
    width: '100%',
    height: undefined,
    aspectRatio: 1,
    resizeMode: 'contain',
  },
  hand: {
    position: 'absolute',
    width: '43%',
    height: undefined,
    aspectRatio: 1,
    resizeMode: 'contain',
    top: '26%',
    left: '47%',
  },
});
