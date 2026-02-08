import React, { useState, useRef, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import './BarcodeScanner.css';

const BarcodeScanner = ({ onScan, onClose }) => {
    const [isScanning, setIsScanning] = useState(true);
    const [error, setError] = useState(null);
    const videoRef = useRef(null);
    const codeReaderRef = useRef(null);

    useEffect(() => {
        const codeReader = new BrowserMultiFormatReader();
        codeReaderRef.current = codeReader;

        const startScanning = async () => {
            try {
                const videoInputDevices = await codeReader.listVideoInputDevices();
                if (videoInputDevices.length === 0) {
                    setError('Keine Kamera gefunden');
                    return;
                }

                // Use back camera if available (mobile)
                const selectedDeviceId = videoInputDevices.find(device =>
                    device.label.toLowerCase().includes('back')
                )?.deviceId || videoInputDevices[0].deviceId;

                await codeReader.decodeFromVideoDevice(
                    selectedDeviceId,
                    videoRef.current,
                    (result, err) => {
                        if (result) {
                            const barcode = result.getText();
                            onScan(barcode);
                            cleanup();
                        }
                    }
                );
            } catch (err) {
                console.error('Scanner error:', err);
                setError('Kamera-Zugriff verweigert oder nicht verfügbar');
            }
        };

        const cleanup = () => {
            if (codeReaderRef.current) {
                codeReaderRef.current.reset();
            }
            setIsScanning(false);
        };

        startScanning();

        return () => cleanup();
    }, [onScan]);

    const handleClose = () => {
        if (codeReaderRef.current) {
            codeReaderRef.current.reset();
        }
        onClose();
    };

    return (
        <div className="scanner-overlay">
            <div className="scanner-container">
                <div className="scanner-header">
                    <h3>Barcode scannen</h3>
                    <button onClick={handleClose} className="btn-close">✕</button>
                </div>

                {error ? (
                    <div className="scanner-error">
                        <p>{error}</p>
                        <button onClick={handleClose} className="btn primary">
                            Schließen
                        </button>
                    </div>
                ) : (
                    <div className="scanner-video-wrapper">
                        <video ref={videoRef} className="scanner-video" />
                        <div className="scanner-frame"></div>
                        <p className="scanner-hint">
                            Barcode in den Rahmen halten
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BarcodeScanner;
