import React, { createContext, useState, useEffect, useContext } from 'react';

// 1. Create the Context
const UserContext = createContext();

// Hook for easy access to the context
export const useUser = () => useContext(UserContext);

// 2. Create the Provider Component
export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    // Function to fetch the full user profile
    const fetchCurrentUser = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setIsAuthenticated(false);
            setUser(null);
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("http://localhost:5000/api/auth/me", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();

            if (res.ok && data.user) {
                // Ensure profilePicture defaults to null if not provided in the database
                data.user.profilePicture = data.user.profilePicture || null;
                
                // Also update localStorage user object for legacy checks (if used outside context)
                localStorage.setItem("user", JSON.stringify(data.user));

                setUser(data.user);
                setIsAuthenticated(true);
            } else {
                // Token invalid or expired
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setIsAuthenticated(false);
                setUser(null);
            }
        } catch (error) {
            console.error("Error fetching user:", error);
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch on component mount
    useEffect(() => {
        fetchCurrentUser();
    }, []);

    // Function to update user data from any component (e.g., after a skill or points change)
    const updateUser = (newUserData) => {
        setUser(prevUser => {
            const updatedUser = {
                ...(prevUser || {}),
                ...newUserData
            };
            // Keep localStorage updated as well
            localStorage.setItem("user", JSON.stringify(updatedUser));
            return updatedUser;
        });
    };

    const logout = () => {
        localStorage.clear();
        setUser(null);
        setIsAuthenticated(false);
    };

    return (
        <UserContext.Provider value={{ user, isAuthenticated, loading, updateUser, fetchCurrentUser, logout }}>
            {children}
        </UserContext.Provider>
    );
};