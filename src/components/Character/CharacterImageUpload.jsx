// File: src/components/Character/CharacterImageUpload.jsx
// Improved with better error handling and image compression

import React, { useState, useRef } from 'react';
import { updateCharacterImage } from '../../api/characterApi';
import '../../styles/CharacterImageUpload.css';

const CharacterImageUpload = ({ character, onImageUpdate, className = "" }) => {
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    // Convert file to base64 data URL with compression
    const fileToDataURL = (file, maxWidth = 400, maxHeight = 400, quality = 0.8) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            img.onload = () => {
                // Calculate new dimensions to keep within limits
                let { width, height } = img;

                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = width * ratio;
                    height = height * ratio;
                }

                // Set canvas size and draw resized image
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to compressed data URL
                const dataURL = canvas.toDataURL('image/jpeg', quality);
                resolve(dataURL);
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    };

    // Validate and process image file
    const processImageFile = async (file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            throw new Error('Please select an image file');
        }

        // Validate file size (10MB limit before compression)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            throw new Error('Image file too large. Please choose a file under 10MB.');
        }

        // Convert to compressed data URL
        const dataURL = await fileToDataURL(file, 400, 400, 0.8);

        // Check final size (should be much smaller after compression)
        const finalSize = new Blob([dataURL]).size;
        console.log(`Original size: ${(file.size / 1024).toFixed(2)}KB, Compressed size: ${(finalSize / 1024).toFixed(2)}KB`);

        return dataURL;
    };

    // Handle file selection
    const handleFileSelect = async (file) => {
        try {
            setUploading(true);

            console.log('Processing image file:', file.name, 'Size:', file.size);
            const imageData = await processImageFile(file);

            console.log('Uploading image for character:', character.id);
            // Use the API function instead of direct fetch
            await updateCharacterImage(character.id, imageData);

            console.log('Image upload successful');
            // Notify parent component
            if (onImageUpdate) {
                onImageUpdate(imageData);
            }

        } catch (error) {
            console.error('Image upload error:', error);

            // More specific error messages
            let errorMessage = 'Failed to upload image';
            if (error.message.includes('network') || error.message.includes('fetch')) {
                errorMessage = 'Network error - please check your connection';
            } else if (error.message.includes('500') || error.message.includes('Internal')) {
                errorMessage = 'Server error - the image might be too large or complex. Try a smaller, simpler image.';
            } else if (error.message.includes('400') || error.message.includes('Invalid')) {
                errorMessage = 'Invalid image format - please try a different image';
            } else if (error.message) {
                errorMessage = error.message;
            }

            alert(errorMessage);
        } finally {
            setUploading(false);
        }
    };

    // Handle file input change
    const handleInputChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    // Handle drag and drop events
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    // Trigger file input click
    const openFileDialog = () => {
        fileInputRef.current?.click();
    };

    // Build CSS class names
    const uploadAreaClasses = [
        'image-upload-area',
        dragActive ? 'drag-active' : '',
        uploading ? 'uploading' : ''
    ].filter(Boolean).join(' ');

    return (
        <div className={`character-image-upload ${className}`}>
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                style={{ display: 'none' }}
            />

            {/* Image display area */}
            <div
                className={uploadAreaClasses}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={!uploading ? openFileDialog : undefined}
            >
                {character.image_data ? (
                    <div className="current-image">
                        <img
                            src={character.image_data}
                            alt={character.name}
                            className="character-avatar"
                        />
                        <div className="image-overlay">
                            {uploading ? (
                                <div className="upload-spinner">Uploading...</div>
                            ) : (
                                <div className="upload-prompt">Click or drag to change image</div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="no-image">
                        {uploading ? (
                            <div className="upload-spinner">Uploading...</div>
                        ) : (
                            <>
                                <div className="upload-icon">📸</div>
                                <div className="upload-text">
                                    <div>Click or drag image here</div>
                                    <div className="upload-subtext">PNG, JPG up to 10MB</div>
                                    <div className="upload-subtext">(will be compressed)</div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CharacterImageUpload;