import { useEffect, useState } from 'react';

const CustomToast = ({ show, onClose, title, message, variant = 'info' }) => {
    const [visible, setVisible] = useState(show);

    useEffect(() => {
        setVisible(show);
        if (show) {
            const timer = setTimeout(() => {
                setVisible(false);
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [show, onClose]);

    const toastVariants = {
        info: "bg-blue-100 border-blue-200 text-blue-800",
        success: "bg-green-100 border-green-200 text-green-800",
        danger: "bg-red-100 border-red-200 text-red-800",
        warning: "bg-yellow-100 border-yellow-200 text-yellow-800"
    };

    const selectedVariant = toastVariants[variant] || toastVariants.info;

    return (
        visible ? (
            <div
                className={`fixed bottom-4 left-1/2 -translate-x-1/2 p-4 rounded-xl shadow-lg z-50 max-w-sm text-center font-medium border-2 
          ${selectedVariant}
          transform transition-all duration-300 ease-in-out
          ${visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}
                role="alert"
            >
                <div className="flex items-center">
                    <div className="flex-grow">
                        {title && <h4 className="font-bold text-lg">{title}</h4>}
                        <p className="text-sm">{message}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="ml-4 -mr-1 text-2xl leading-none font-bold opacity-75 hover:opacity-100 focus:outline-none"
                        aria-label="Close"
                    >
                        &times;
                    </button>
                </div>
            </div>
        ) : null
    );
};

export default CustomToast;
