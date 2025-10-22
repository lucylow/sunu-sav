import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Vibration,
  Platform,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { RNCamera } from 'react-native-camera';
import Svg, { Rect, Line } from 'react-native-svg';
import { parseLightningPayload } from '../utils/lightning';
import { payBolt11, queuePendingPayment } from '../services/lightningService';
import I18n from '../i18n';
import NetInfo from '@react-native-community/netinfo';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const SCAN_RECT_SIZE = Math.min(screenWidth * 0.7, 300);

export default function QrScannerScreen({ navigation }) {
  const cameraRef = useRef(null);
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [flashMode, setFlashMode] = useState(RNCamera.Constants.FlashMode.off);

  useEffect(() => {
    // Monitor network connectivity
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(Boolean(state.isConnected));
    });

    return () => unsubscribe();
  }, []);

  const provideFeedback = useCallback(() => {
    // Haptic feedback and vibration
    if (Platform.OS === 'ios') {
      Vibration.vibrate(100);
    } else {
      Vibration.vibrate(120);
    }
  }, []);

  const onBarCodeRead = useCallback(async ({ data }) => {
    if (scanned || isProcessing) return; // Prevent multiple scans
    
    setScanned(true);
    provideFeedback();

    try {
      // Parse the scanned data
      const parsed = parseLightningPayload(data);
      
      if (parsed.type === 'bolt11') {
        // Handle BOLT11 invoice
        await handleBolt11Payment(parsed);
      } else if (parsed.type === 'lnurl') {
        // Handle LNURL (simplified - would need more complex flow)
        Alert.alert(
          I18n.t('lnurl_detected'),
          I18n.t('lnurl_not_supported_yet'),
          [{ text: I18n.t('ok'), onPress: () => setScanned(false) }]
        );
      } else {
        // Unknown format
        Alert.alert(
          I18n.t('invalid_qr'),
          I18n.t('please_scan_lightning_invoice'),
          [{ text: I18n.t('ok'), onPress: () => setScanned(false) }]
        );
      }
    } catch (error) {
      console.error('QR scan error:', error);
      Alert.alert(
        I18n.t('scan_error'),
        error.message || I18n.t('unknown_error'),
        [{ text: I18n.t('ok'), onPress: () => setScanned(false) }]
      );
    }
  }, [scanned, isProcessing]);

  const handleBolt11Payment = async (parsed) => {
    setIsProcessing(true);
    
    try {
      if (!isOnline) {
        // Queue payment for when back online
        const paymentId = await queuePendingPayment({
          type: 'bolt11',
          invoice: parsed.invoice,
          amount: parsed.amountSats
        });
        
        Alert.alert(
          I18n.t('offline_mode'),
          I18n.t('payment_queued_offline'),
          [
            { 
              text: I18n.t('ok'), 
              onPress: () => navigation.goBack() 
            }
          ]
        );
      } else {
        // Process payment immediately
        const result = await payBolt11(parsed.invoice);
        
        if (result.success) {
          Alert.alert(
            I18n.t('payment_success'),
            I18n.t('payment_completed_successfully'),
            [
              { 
                text: I18n.t('ok'), 
                onPress: () => navigation.goBack() 
              }
            ]
          );
        } else {
          throw new Error(result.error || I18n.t('payment_failed'));
        }
      }
    } catch (error) {
      Alert.alert(
        I18n.t('payment_error'),
        error.message || I18n.t('payment_failed'),
        [
          { 
            text: I18n.t('retry'), 
            onPress: () => setScanned(false) 
          },
          { 
            text: I18n.t('cancel'), 
            onPress: () => navigation.goBack() 
          }
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleFlash = () => {
    setFlashMode(prev => 
      prev === RNCamera.Constants.FlashMode.off 
        ? RNCamera.Constants.FlashMode.torch 
        : RNCamera.Constants.FlashMode.off
    );
  };

  const resetScanner = () => {
    setScanned(false);
    setIsProcessing(false);
  };

  return (
    <View style={styles.container}>
      <RNCamera
        ref={cameraRef}
        style={styles.preview}
        type={RNCamera.Constants.Type.back}
        captureAudio={false}
        flashMode={flashMode}
        androidCameraPermissionOptions={{
          title: I18n.t('camera_permission_title'),
          message: I18n.t('camera_permission_message'),
          buttonPositive: I18n.t('ok'),
          buttonNegative: I18n.t('cancel'),
        }}
        onBarCodeRead={onBarCodeRead}
        barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}
      >
        {/* Overlay with scanning area */}
        <View style={styles.overlay}>
          <Svg height="100%" width="100%">
            {/* Semi-transparent background */}
            <Rect
              x={0}
              y={0}
              width="100%"
              height="100%"
              fill="rgba(0,0,0,0.5)"
            />
            
            {/* Scanning window */}
            <Rect
              x={(screenWidth - SCAN_RECT_SIZE) / 2}
              y={(screenHeight - SCAN_RECT_SIZE) / 2 - 50}
              width={SCAN_RECT_SIZE}
              height={SCAN_RECT_SIZE}
              fill="transparent"
              stroke="#FFFFFF"
              strokeWidth={2}
              rx={12}
              ry={12}
            />
            
            {/* Corner indicators */}
            <Line
              x1={(screenWidth - SCAN_RECT_SIZE) / 2}
              y1={(screenHeight - SCAN_RECT_SIZE) / 2 - 50}
              x2={(screenWidth - SCAN_RECT_SIZE) / 2 + 30}
              y2={(screenHeight - SCAN_RECT_SIZE) / 2 - 50}
              stroke="#34C759"
              strokeWidth={4}
            />
            <Line
              x1={(screenWidth - SCAN_RECT_SIZE) / 2}
              y1={(screenHeight - SCAN_RECT_SIZE) / 2 - 50}
              x2={(screenWidth - SCAN_RECT_SIZE) / 2}
              y2={(screenHeight - SCAN_RECT_SIZE) / 2 - 20}
              stroke="#34C759"
              strokeWidth={4}
            />
            <Line
              x1={(screenWidth + SCAN_RECT_SIZE) / 2}
              y1={(screenHeight - SCAN_RECT_SIZE) / 2 - 50}
              x2={(screenWidth + SCAN_RECT_SIZE) / 2 - 30}
              y2={(screenHeight - SCAN_RECT_SIZE) / 2 - 50}
              stroke="#34C759"
              strokeWidth={4}
            />
            <Line
              x1={(screenWidth + SCAN_RECT_SIZE) / 2}
              y1={(screenHeight - SCAN_RECT_SIZE) / 2 - 50}
              x2={(screenWidth + SCAN_RECT_SIZE) / 2}
              y2={(screenHeight - SCAN_RECT_SIZE) / 2 - 20}
              stroke="#34C759"
              strokeWidth={4}
            />
            <Line
              x1={(screenWidth - SCAN_RECT_SIZE) / 2}
              y1={(screenHeight + SCAN_RECT_SIZE) / 2 - 50}
              x2={(screenWidth - SCAN_RECT_SIZE) / 2 + 30}
              y2={(screenHeight + SCAN_RECT_SIZE) / 2 - 50}
              stroke="#34C759"
              strokeWidth={4}
            />
            <Line
              x1={(screenWidth - SCAN_RECT_SIZE) / 2}
              y1={(screenHeight + SCAN_RECT_SIZE) / 2 - 50}
              x2={(screenWidth - SCAN_RECT_SIZE) / 2}
              y2={(screenHeight + SCAN_RECT_SIZE) / 2 - 30}
              stroke="#34C759"
              strokeWidth={4}
            />
            <Line
              x1={(screenWidth + SCAN_RECT_SIZE) / 2}
              y1={(screenHeight + SCAN_RECT_SIZE) / 2 - 50}
              x2={(screenWidth + SCAN_RECT_SIZE) / 2 - 30}
              y2={(screenHeight + SCAN_RECT_SIZE) / 2 - 50}
              stroke="#34C759"
              strokeWidth={4}
            />
            <Line
              x1={(screenWidth + SCAN_RECT_SIZE) / 2}
              y1={(screenHeight + SCAN_RECT_SIZE) / 2 - 50}
              x2={(screenWidth + SCAN_RECT_SIZE) / 2}
              y2={(screenHeight + SCAN_RECT_SIZE) / 2 - 30}
              stroke="#34C759"
              strokeWidth={4}
            />
          </Svg>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructions}>
            {I18n.t('scan_qr_instruction')}
          </Text>
          <Text style={styles.subInstructions}>
            {I18n.t('position_qr_in_frame')}
          </Text>
        </View>

        {/* Bottom controls */}
        <View style={styles.bottomControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={resetScanner}
            disabled={isProcessing}
          >
            <Text style={styles.controlButtonText}>
              {I18n.t('reset')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleFlash}
          >
            <Text style={styles.controlButtonText}>
              {flashMode === RNCamera.Constants.FlashMode.off 
                ? I18n.t('flash_on') 
                : I18n.t('flash_off')
              }
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.controlButtonText}>
              {I18n.t('cancel')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Processing indicator */}
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#34C759" />
            <Text style={styles.processingText}>
              {I18n.t('processing_payment')}
            </Text>
          </View>
        )}

        {/* Offline indicator */}
        {!isOnline && (
          <View style={styles.offlineIndicator}>
            <Text style={styles.offlineText}>
              {I18n.t('offline_mode')}
            </Text>
          </View>
        )}
      </RNCamera>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionsContainer: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  instructions: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  subInstructions: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },
  controlButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  offlineIndicator: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,59,48,0.9)',
    paddingVertical: 8,
    alignItems: 'center',
  },
  offlineText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
