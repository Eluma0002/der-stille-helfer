/**
 * useVoiceControl – Web Speech API Hook
 *
 * Sprache: de-DE
 * Push-to-talk: startListening() / stopListening()
 * Gibt transcript + isFinal zurück
 */

import { useState, useRef, useCallback, useEffect } from 'react';

const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition || null;

export function useVoiceControl({ onResult, onError } = {}) {
    const [isListening,   setIsListening]   = useState(false);
    const [transcript,    setTranscript]    = useState('');
    const [interimText,   setInterimText]   = useState('');
    const [supported,     setSupported]     = useState(!!SpeechRecognition);
    const recognitionRef  = useRef(null);
    const onResultRef     = useRef(onResult);
    const onErrorRef      = useRef(onError);

    useEffect(() => { onResultRef.current = onResult; }, [onResult]);
    useEffect(() => { onErrorRef.current  = onError;  }, [onError]);

    const startListening = useCallback(() => {
        if (!SpeechRecognition) {
            onErrorRef.current?.('Spracherkennung wird von diesem Browser nicht unterstützt.');
            return;
        }
        if (recognitionRef.current) {
            recognitionRef.current.abort();
        }

        const rec = new SpeechRecognition();
        rec.lang              = 'de-DE';
        rec.continuous        = false;
        rec.interimResults    = true;
        rec.maxAlternatives   = 1;

        rec.onstart = () => {
            setIsListening(true);
            setTranscript('');
            setInterimText('');
        };

        rec.onresult = (event) => {
            let interim = '';
            let final   = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const text = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    final += text;
                } else {
                    interim += text;
                }
            }

            setInterimText(interim);
            if (final) {
                setTranscript(final);
                onResultRef.current?.(final.trim());
            }
        };

        rec.onerror = (event) => {
            const msg = event.error === 'no-speech'
                ? 'Kein Ton erkannt – bitte noch einmal sprechen.'
                : event.error === 'not-allowed'
                ? 'Mikrofon-Zugriff verweigert. Bitte in den Browser-Einstellungen erlauben.'
                : `Sprachfehler: ${event.error}`;
            onErrorRef.current?.(msg);
            setIsListening(false);
        };

        rec.onend = () => {
            setIsListening(false);
            setInterimText('');
        };

        recognitionRef.current = rec;
        rec.start();
    }, []);

    const stopListening = useCallback(() => {
        recognitionRef.current?.stop();
        setIsListening(false);
    }, []);

    // Cleanup beim Unmount
    useEffect(() => {
        return () => recognitionRef.current?.abort();
    }, []);

    return {
        isListening,
        transcript,
        interimText,
        supported,
        startListening,
        stopListening,
    };
}
