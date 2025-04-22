import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
    const navigate = useNavigate();

    const CheckIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
    );

    const StarIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
    );

    const ChevronRightIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
    );

    const AwardIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="7"></circle>
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
        </svg>
    );

    const UserIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
        </svg>
    );

    const ClockIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
    );

    const GiftIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 12 20 22 4 22 4 12"></polyline>
            <rect x="2" y="7" width="20" height="5"></rect>
            <line x1="12" y1="22" x2="12" y2="7"></line>
            <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
            <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
        </svg>
    );

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Navigation Bar */}
            <nav className="bg-white shadow-md py-4 px-6 fixed w-full top-0 z-10">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center">
                        <button
                            onClick={() => navigate("/")}
                            className="flex items-center mr-10 focus:outline-none"
                        >
                            <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                                <AwardIcon className="text-white" />
                            </div>
                            <span className="ml-2 text-xl font-bold text-gray-800">Pedal Points</span>
                        </button>
                        
                        <div className="hidden md:flex space-x-6">
                            <button onClick={() => navigate('/about')} className="text-gray-600 hover:text-green-600">About Us</button>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        <button onClick={() => navigate('/user/create')} className="px-4 py-2 text-gray-600 hover:text-green-600">Sign Up</button>
                        <button onClick={() => navigate('/login')} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition">
                            Login
                        </button>
                    </div>
                </div>
            </nav>

            <div className="pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center">
                        <div className="md:w-1/2 mb-12 md:mb-0">
                            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
                                Drive Safe, <span className="text-green-500">Earn Rewards</span>
                            </h1>
                            <p className="text-lg text-gray-600 mb-8">
                                Join Pedal Points and turn your safe driving habits into amazing rewards.
                                The safer you drive, the more points you earn!
                            </p>
                            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                                <button onClick={() => navigate('/user/create')} className="px-6 py-3 bg-green-500 text-white font-medium rounded-md hover:bg-green-600 transition flex items-center justify-center">
                                    Get Started <ChevronRightIcon size={20} className="ml-2" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="py-16 px-6 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-800 mb-4">How Pedal Points Works</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Our system makes it easy to earn rewards for being a safe driver. No complicated setup required!
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="p-6 bg-gray-50 rounded-lg shadow-sm">
                            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                <UserIcon className="text-blue-500" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">1. Sign Up</h3>
                            <p className="text-gray-600">
                                Create an account and apply to an organization(s) that you want to drive for.
                            </p>
                        </div>
                        
                        <div className="p-6 bg-gray-50 rounded-lg shadow-sm">
                            <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                                <ClockIcon className="text-purple-500" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">2. Drive Safely</h3>
                            <p className="text-gray-600">
                                Sponsors will track your driving behavior and reward or deduct points based on your actions.
                            </p>
                        </div>
                        
                        <div className="p-6 bg-gray-50 rounded-lg shadow-sm">
                            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <GiftIcon className="text-green-500" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">3. Earn Rewards</h3>
                            <p className="text-gray-600">
                                Redeem your points for music, podcasts, movies, TV shows, and audiobooks.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="py-16 px-6 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-800 mb-4">Benefits of Pedal Points</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Join thousands of drivers who are being rewarded for their safe driving habits.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex items-start">
                            <CheckIcon className="text-green-500 flex-shrink-0 mt-1" />
                            <div className="ml-4">
                                <h3 className="text-xl font-semibold mb-2">Safer Roads</h3>
                                <p className="text-gray-600">
                                    Be part of a community that's making our roads safer for everyone.
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-start">
                            <CheckIcon className="text-green-500 flex-shrink-0 mt-1" />
                            <div className="ml-4">
                                <h3 className="text-xl font-semibold mb-2">Personalized Insights</h3>
                                <p className="text-gray-600">
                                    Get feedback and tips to improve your driving habits and maximize your rewards.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Testimonials Section */}
            <div className="py-16 px-6 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-800 mb-4">What Our Drivers Say</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Join thousands of satisfied drivers who've improved their habits and earned great rewards.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="p-6 bg-gray-50 rounded-lg shadow-sm">
                            <div className="flex mb-4">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <StarIcon key={star} className="text-yellow-400" />
                                ))}
                            </div>
                            <p className="text-gray-600 mb-4">
                                "I've earned over $200 in rewards just by driving the way I normally do. It's like getting paid to be safe!"
                            </p>
                            <div className="flex items-center">
                                <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium">Michael T.</p>
                                    <p className="text-xs text-gray-500">Member since 2025</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6 bg-gray-50 rounded-lg shadow-sm">
                            <div className="flex mb-4">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <StarIcon key={star} className="text-yellow-400" />
                                ))}
                            </div>
                            <p className="text-gray-600 mb-4">
                                "The app has actually made me more conscious of my driving habits. I'm a better driver now and saving money too."
                            </p>
                            <div className="flex items-center">
                                <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium">Sarah L.</p>
                                    <p className="text-xs text-gray-500">Member since 2025</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6 bg-gray-50 rounded-lg shadow-sm">
                            <div className="flex mb-4">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <StarIcon key={star} className="text-yellow-400" />
                                ))}
                            </div>
                            <p className="text-gray-600 mb-4">
                                "I love that safe driving actually pays off now. It’s encouraging and easy to track my progress."
                            </p>
                            <div className="flex items-center">
                                <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium">James K.</p>
                                    <p className="text-xs text-gray-500">Member since 2025</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="py-16 px-6 bg-green-500">
                <div className="max-w-5xl mx-auto text-center">
                    <h2 className="text-3xl font-bold text-white mb-6">Ready to Get Rewarded for Safe Driving?</h2>
                    <p className="text-white text-lg mb-8 max-w-2xl mx-auto">
                        Join Pedal Points today and start earning rewards for the safe driving habits you already have.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                        <button onClick={() => navigate('/user/create')} className="px-8 py-3 bg-white text-green-600 font-medium rounded-md hover:bg-gray-100 transition">
                            Sign Up Now
                        </button>
                    </div>
                </div>
            </div>

            <footer className="bg-gray-800 text-white py-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <div className="flex items-center mb-4">
                                <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                                    <AwardIcon className="text-white" />
                                </div>
                                <span className="ml-2 text-xl font-bold">Pedal Points</span>
                            </div>
                            <p className="text-gray-400">
                                Rewarding safe drivers since 2025.
                            </p>
                        </div>
                        
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Company</h3>
                            <ul className="space-y-2">
                                <li><button onClick={() => navigate('/about')} className="text-gray-400 hover:text-white">About Us</button></li>
                                <li><button onClick={() => navigate('')} className="text-gray-400 hover:text-white">Careers</button></li>
                                <li><button onClick={() => navigate('')} className="text-gray-400 hover:text-white">Press</button></li>
                            </ul>
                        </div>
                        
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Resources</h3>
                            <ul className="space-y-2">
                                <li><button onClick={() => navigate('')} className="text-gray-400 hover:text-white">Help Center</button></li>
                                <li><button onClick={() => navigate('/driving-tips')} className="text-gray-400 hover:text-white">Safe Driving Tips</button></li>
                                <li><button onClick={() => navigate('')} className="text-gray-400 hover:text-white">Rewards Catalog</button></li>
                                <li><button onClick={() => navigate('')} className="text-gray-400 hover:text-white">Partners</button></li>
                            </ul>
                        </div>
                        
                        {/* This is just placeholder information */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Contact</h3>
                            <ul className="space-y-2">
                                <li className="text-gray-400">support@pedalpoints.com</li>
                                <li className="text-gray-400">1-800-DRIVE-SAFE</li>
                                <li className="text-gray-400">123 Safety Road, Drivetown</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div className="pt-8 border-t border-gray-700 flex flex-col md:flex-row justify-between items-center">
                        <p className="text-gray-400 text-sm">© 2025 Pedal Points. All rights reserved.</p>
                        <div className="flex space-x-4 mt-4 md:mt-0">
                            <button onClick={() => navigate('')} className="text-gray-400 hover:text-white">Privacy Policy</button>
                            <button onClick={() => navigate('')} className="text-gray-400 hover:text-white">Terms of Service</button>
                            <button onClick={() => navigate('')} className="text-gray-400 hover:text-white">Cookie Policy</button>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;