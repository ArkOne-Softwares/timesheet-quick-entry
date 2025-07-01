import React from 'react';

export default function Modal({ isOpen, onClose, title, children, size = 'medium' }) {
    if (!isOpen) return null;

    const sizeClasses = {
        small: 'modal-small',
        medium: 'modal-medium', 
        large: 'modal-large'
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div 
                className={`modal-content ${sizeClasses[size]}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h3 className="modal-title">{title}</h3>
                    <button 
                        className="modal-close-btn"
                        onClick={onClose}
                        type="button"
                    >
                        ✕
                    </button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
}
