import React, { useState, useRef } from 'react';

const CharacterImageUpload = ({ character, onImageUpdate, className = "" }) => {
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    // Convert file to base64 data URL
    const fileToDataURL = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    // Validate and process image file
    const processImageFile = async (file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            throw new Error('Please select an image file');
        }

        // Validate file size (5MB limit)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            throw new Error('Image file too large. Please choose a file under 5MB.');
        }

        // Convert to data URL
        const dataURL = await fileToDataURL(file);
        return dataURL;
    };

    // Handle file selection
    const handleFileSelect = async (file) => {
        try {
            setUploading(true);

            const imageData = await processImageFile(file);

            // Call the API to update character image
            const response = await fetch(`/api/character/${character.id}/image`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ image_data: imageData })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to upload image');
            }

            // Notify parent component
            if (onImageUpdate) {
                onImageUpdate(imageData);
            }

        } catch (error) {
            console.error('Image upload error:', error);
            alert(error.message || 'Failed to upload image');
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

    // Handle drag and drop
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
                className={`image-upload-area ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
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
                                    <div className="upload-subtext">PNG, JPG up to 5MB</div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            <style jsx>{`
                .character-image-upload {
                    width: 100%;
                    max-width: 200px;
                }

                .image-upload-area {
                    position: relative;
                    width: 100%;
                    height: 200px;
                    border: 2px dashed #4b5563;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    overflow: hidden;
                }

                .image-upload-area:hover:not(.uploading) {
                    border-color: #3b82f6;
                    background-color: rgba(59, 130, 246, 0.05);
                }

                .image-upload-area.drag-active {
                    border-color: #10b981;
                    background-color: rgba(16, 185, 129, 0.1);
                }

                .image-upload-area.uploading {
                    cursor: not-allowed;
                    opacity: 0.7;
                }

                .current-image {
                    position: relative;
                    width: 100%;
                    height: 100%;
                }

                .character-avatar {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    border-radius: 10px;
                }

                .image-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                    border-radius: 10px;
                }

                .current-image:hover .image-overlay {
                    opacity: 1;
                }

                .no-image {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: #6b7280;
                    text-align: center;
                    padding: 20px;
                }

                .upload-icon {
                    font-size: 2rem;
                    margin-bottom: 8px;
                }

                .upload-text {
                    font-size: 0.9rem;
                }

                .upload-subtext {
                    font-size: 0.8rem;
                    color: #9ca3af;
                    margin-top: 4px;
                }

                .upload-prompt,
                .upload-spinner {
                    font-size: 0.9rem;
                    text-align: center;
                }

                .upload-spinner::after {
                    content: '';
                    display: inline-block;
                    width: 16px;
                    height: 16px;
                    border: 2px solid #ffffff;
                    border-radius: 50%;
                    border-top-color: transparent;
                    animation: spin 1s linear infinite;
                    margin-left: 8px;
                }

                @keyframes spin {
                    to {
                        transform: rotate(360deg);
                    }
                }
            `}</style>
        </div>
    );
};

export default CharacterImageUpload;