import React, { useState } from 'react';
import { getIconPath, getEmojiForProduct } from '../utils/iconMapping';
import './ProductIcon.css';

/**
 * ProductIcon Component
 *
 * Hybrid icon system:
 * 1. Tries to load real icon from /icons/{product}.png
 * 2. Falls back to emoji if icon not found
 * 3. Supports custom icon override
 *
 * @param {string} productName - Name of the product
 * @param {string} customIcon - Custom icon path (optional)
 * @param {string} size - Size: 'small', 'medium', 'large' (default: 'medium')
 * @param {string} className - Additional CSS classes
 */
const ProductIcon = ({
    productName,
    customIcon = null,
    size = 'medium',
    className = '',
    onClick = null
}) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    const iconPath = customIcon || getIconPath(productName);
    const emoji = getEmojiForProduct(productName);

    const handleImageError = () => {
        setImageError(true);
        setImageLoaded(false);
    };

    const handleImageLoad = () => {
        setImageLoaded(true);
        setImageError(false);
    };

    const sizeClasses = {
        small: 'icon-small',
        medium: 'icon-medium',
        large: 'icon-large'
    };

    const shouldShowImage = iconPath && !imageError;

    return (
        <div
            className={`product-icon-container ${sizeClasses[size]} ${className}`}
            onClick={onClick}
            title={productName}
        >
            {shouldShowImage && (
                <img
                    src={iconPath}
                    alt={productName}
                    className={`product-icon-image ${imageLoaded ? 'loaded' : 'loading'}`}
                    onError={handleImageError}
                    onLoad={handleImageLoad}
                    style={{ display: imageLoaded ? 'block' : 'none' }}
                />
            )}

            {(!shouldShowImage || !imageLoaded) && (
                <span className="product-icon-emoji">
                    {emoji}
                </span>
            )}
        </div>
    );
};

export default ProductIcon;
