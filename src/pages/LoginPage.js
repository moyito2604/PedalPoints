import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './HomePage.css';

const LoginPage = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const REACT_APP_BASEURL = process.env.REACT_APP_BASEURL || 'http://127.0.0.1:5000';
    const MAX_ATTEMPTS = 5;
    const LOCKOUT_DURATION = 5 * 60 * 1000;

    const AwardIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="7"></circle>
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
        </svg>
    );

    const checkAccountLock = useCallback(() => {
        const lockData = JSON.parse(localStorage.getItem(`lock_${username}`));
        if (lockData && lockData.lockUntil > Date.now()) {
            const remainingTime = Math.ceil((lockData.lockUntil - Date.now()) / 1000);
            setErrorMessage(`Account locked. Try again in ${remainingTime} seconds.`);
        } else if (lockData) {
            localStorage.removeItem(`lock_${username}`);
        }
    }, [username]);

    useEffect(() => {
        checkAccountLock();
    }, [checkAccountLock]);

    const handleLoginFailure = () => {
        const attemptsData = JSON.parse(localStorage.getItem(`attempts_${username}`)) || {
            attempts: 0,
            firstAttemptTime: Date.now(),
        };

        if (Date.now() - attemptsData.firstAttemptTime > LOCKOUT_DURATION) {
            attemptsData.attempts = 1;
            attemptsData.firstAttemptTime = Date.now();
        } else {
            attemptsData.attempts += 1;
        }

        localStorage.setItem(`attempts_${username}`, JSON.stringify(attemptsData));

        if (attemptsData.attempts >= MAX_ATTEMPTS) {
            const lockData = {
                lockUntil: Date.now() + LOCKOUT_DURATION,
            };
            localStorage.setItem(`lock_${username}`, JSON.stringify(lockData));
            setErrorMessage(`Account locked due to too many failed attempts. Try again in 5 minutes.`);
        } else {
            setErrorMessage(`Incorrect username or password. Attempt ${attemptsData.attempts}/${MAX_ATTEMPTS}`);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const lockData = JSON.parse(localStorage.getItem(`lock_${username}`));
        if (lockData && lockData.lockUntil > Date.now()) {
            const remainingTime = Math.ceil((lockData.lockUntil - Date.now()) / 1000);
            setErrorMessage(`Account locked. Try again in ${remainingTime} seconds.`);
            return;
        }

        try {
            const response = await axios.post(REACT_APP_BASEURL + '/login', {
                username,
                password,
            });

            if (response.data.success) {
                localStorage.removeItem(`attempts_${username}`);
                localStorage.removeItem(`lock_${username}`);

                const user = {
                    id: response.data.user.id,
                    username: response.data.user.username,
                    firstname: response.data.user.firstname,
                    lastname: response.data.user.lastname,
                    role: response.data.user.role,
                };

                localStorage.setItem('user', JSON.stringify(user));

                if (user.role === "sponsor") {
                    navigate('/sponsor/landing');
                } else if (user.role === "admin") {
                    navigate('/admin/landing');
                } else {
                    navigate('/user/landing');
                }
            } else {
                handleLoginFailure();
            }
        } catch (error) {
            setErrorMessage('An error occurred. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
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
                    </div>
                </div>
            </nav>

            <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Login</h2>
                {errorMessage && (
                    <p className="text-red-600 text-sm text-center mb-4">{errorMessage}</p>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full border border-gray-300 p-3 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full border border-gray-300 p-3 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="showPassword"
                            checked={showPassword}
                            onChange={() => setShowPassword(!showPassword)}
                            className="mr-2"
                        />
                        <label htmlFor="showPassword" className="text-sm text-gray-600">Show Password</label>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md"
                    >
                        Login
                    </button>
                </form>
                <p className="text-sm text-center text-gray-600 mt-4">
                    Don't have an account? <Link to="/user/create" className="text-green-600 hover:underline">Create one here</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
