import React, { useState, useRef } from 'react';
import { strings } from '../strings/de.js';
import { exportDatabase, importDatabase } from '../db/backup';
import './BackupExport.css';

const BackupExport = () => {
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [messageType, setMessageType] = useState(''); // 'success' or 'error'

    // Import state
    const [selectedFile, setSelectedFile] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef(null);
    const dialogRef = useRef(null);

    const handleExport = async () => {
        setIsExporting(true);
        setMessageType('');

        const success = await exportDatabase(setProgress, setMessage);

        setMessageType(success ? 'success' : 'error');
        setIsExporting(false);

        // Auto-clear success message after 3 seconds
        if (success) {
            setTimeout(() => {
                setMessage('');
                setMessageType('');
                setProgress(0);
            }, 3000);
        }
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            setShowConfirm(true);
            if (dialogRef.current) {
                dialogRef.current.showModal();
            }
        }
    };

    const handleImportConfirm = async () => {
        if (!selectedFile) return;

        setShowConfirm(false);
        if (dialogRef.current) {
            dialogRef.current.close();
        }

        setIsImporting(true);
        setMessageType('');

        const success = await importDatabase(selectedFile, setProgress, setMessage);

        setMessageType(success ? 'success' : 'error');
        if (!success) {
            setIsImporting(false);
        }
        // If success, page will reload automatically
    };

    const handleImportCancel = () => {
        setShowConfirm(false);
        setSelectedFile(null);
        if (dialogRef.current) {
            dialogRef.current.close();
        }
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="backup-page">
            <h2>{strings.backup.title} 💾</h2>

            {/* Safari warning card */}
            <div className="backup-card backup-warning">
                <h3>⚠️ {strings.backup.warningTitle}</h3>
                <p>{strings.backup.warningText}</p>
            </div>

            {/* Export card */}
            <div className="backup-card">
                <h3>{strings.backup.exportTitle}</h3>
                <p>{strings.backup.exportDesc}</p>
                <button
                    className="btn btn-primary"
                    onClick={handleExport}
                    disabled={isExporting}
                >
                    {isExporting ? strings.backup.exportProgress : strings.backup.exportButton}
                </button>

                {/* Progress bar */}
                {isExporting && (
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                )}

                {/* Status message */}
                {message && (
                    <div className={`message ${messageType === 'success' ? 'message-success' : 'message-error'}`}>
                        {message}
                    </div>
                )}
            </div>

            {/* Import card */}
            <div className="backup-card">
                <h3>{strings.backup.importTitle}</h3>
                <p>{strings.backup.importDesc}</p>

                {/* Hidden file input */}
                <input
                    type="file"
                    accept=".json"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />

                <button
                    className="btn btn-primary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                >
                    {isImporting ? strings.backup.importProgress : strings.backup.selectFile}
                </button>

                {/* Show selected filename */}
                {selectedFile && !isImporting && (
                    <div className="selected-file">
                        📄 {selectedFile.name}
                    </div>
                )}

                {/* Progress bar */}
                {isImporting && (
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                )}

                {/* Status message */}
                {message && !isExporting && (
                    <div className={`message ${messageType === 'success' ? 'message-success' : 'message-error'}`}>
                        {message}
                    </div>
                )}
            </div>

            {/* Confirmation dialog */}
            <dialog ref={dialogRef} className="confirm-dialog">
                <h3>{strings.backup.importConfirmTitle}</h3>
                <p className="confirm-text">{strings.backup.importConfirmText}</p>
                <div className="dialog-buttons">
                    <button className="btn" onClick={handleImportCancel}>
                        {strings.backup.importConfirmNo}
                    </button>
                    <button className="btn btn-danger" onClick={handleImportConfirm}>
                        {strings.backup.importConfirmYes}
                    </button>
                </div>
            </dialog>
        </div>
    );
};

export default BackupExport;
