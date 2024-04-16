import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import App from '../App';

jest.mock('../BluetoothFunctions', () => ({
  bleRequestBluetoothPermission: jest.fn().mockResolvedValue(true),
  bleScanAndConnect: jest.fn().mockResolvedValue({ name: 'Test Device' }),
  bleWriteString: jest.fn().mockResolvedValue(true)
}));

describe('App Component', () => {
  it('renders and allows initiating BLE connection', async () => {
    const { getByText } = render(<App />);
    const statusText = getByText(/BLE Not Connected/);
    expect(statusText).toBeTruthy();

    const reloadButton = getByText('Reload');
    fireEvent.press(reloadButton);

    const connectedStatus = await findByText(/Connected to: Test Device/);
    expect(connectedStatus).toBeTruthy();
  });

  it('increments theta when increment button is pressed', async () => {
    const { getByText } = render(<App />);
    const incrementButton = getByText('+');
    fireEvent.press(incrementButton);

    const thetaText = getByText(/30°/); // Assuming initial theta was 0°
    expect(thetaText).toBeTruthy();
  });
});
