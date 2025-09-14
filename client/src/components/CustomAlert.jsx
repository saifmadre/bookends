import { useEffect, useState } from 'react';

const CustomAlert = ({ message, variant = 'info' }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Show the alert with a slight delay to allow for the animation
        const timer = setTimeout(() => setVisible(true), 50);
        return () => clearTimeout(timer);
    }, []);

    const alertVariants = {
        info: "bg-blue-100 border-blue-200 text-blue-800",
        success: "bg-green-100 border-green-200 text-green-800",
        danger: "bg-red-100 border-red-200 text-red-800",
        warning: "bg-yellow-100 border-yellow-200 text-yellow-800"
    };

    const selectedVariant = alertVariants[variant] || alertVariants.info;

    return (
        <div
            className={`fixed top-4 left-1/2 -translate-x-1/2 p-4 rounded-xl shadow-lg z-50 max-w-sm text-center font-medium border-2 
        ${selectedVariant}
        transform transition-all duration-300 ease-in-out
        ${visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}
        >
            <p className="font-semibold text-lg">{message}</p>
        </div>
    );
};

export default CustomAlert;