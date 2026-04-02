import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-9xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-3xl font-semibold text-white mb-6">Oops! Page Missing.</h2>
        <p className="text-gray-400 max-w-md mx-auto mb-10 text-lg">
          Looks like the muscle gain you were searching for is in another room. This page doesn't exist or has moved.
        </p>
        <Link 
          to="/home" 
          className="px-8 py-3 bg-primary text-black font-bold rounded-lg hover:bg-yellow-500 transition-colors shadow-lg shadow-primary/20"
        >
          BACK TO GYM
        </Link>
      </motion.div>
      
      {/* Decorative background element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 opacity-10">
        <img src="/logo.png" alt="" className="w-80 h-auto filter grayscale blur-sm" />
      </div>
    </div>
  );
};

export default NotFound;
