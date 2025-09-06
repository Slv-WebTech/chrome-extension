// src/Components/Home.js - Main Home Component for Chrome Extension
import React, { useState, useEffect, useCallback } from 'react';
import { Box, VStack, HStack, Button } from '@chakra-ui/react';
import Header from './Header';
import GlassCard from './GlassCard';
import QuoteWidget from './QuoteWidget';
import WeatherWidget from './WeatherWidget';
import Settings from './Settings';
import { apiService } from '../ApiServices/Api';

const Home = () => {
    const [quote, setQuote] = useState('');
    const [author, setAuthor] = useState('');
    const [weather, setWeather] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);

    // Custom toast function for Chakra UI v3
    const showToast = (title, description, status = 'info') => {
        console.log(`${status.toUpperCase()}: ${title} - ${description}`);
        // In a real Chrome extension, you might want to use Chrome notifications API
        // chrome.notifications.create({ ... })
    };

    const loadInitialData = useCallback(async () => {
        try {
            setIsLoading(true);

            // Load quote and weather data
            const [quoteData, weatherData] = await Promise.all([
                apiService.getCurrentQuote(),
                apiService.getCurrentWeather()
            ]);

            setQuote(quoteData.quote);
            setAuthor(quoteData.author);
            setWeather(weatherData);

        } catch (error) {
            console.error('Error loading data:', error);
            showToast('Error', 'Failed to load data. Please check your connection.', 'error');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadInitialData();

        // Set up periodic data refresh
        const interval = setInterval(loadInitialData, 5 * 60 * 1000); // Every 5 minutes

        return () => clearInterval(interval);
    }, [loadInitialData]);

    const handleRefresh = async () => {
        try {
            setIsLoading(true);

            // Refresh both quote and weather
            await Promise.all([
                apiService.refreshQuote(),
                apiService.refreshWeather()
            ]);

            // Reload the data after refresh
            await loadInitialData();

            showToast('Success', 'Data refreshed successfully!', 'success');

        } catch (error) {
            console.error('Error refreshing data:', error);
            showToast('Error', 'Failed to refresh data. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box
            minHeight="100vh"
            bg="linear-gradient(135deg, rgba(74, 144, 226, 0.1) 0%, rgba(80, 227, 194, 0.1) 50%, rgba(255, 182, 193, 0.1) 100%)"
            position="relative"
            overflow="hidden"
            _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(74, 144, 226, 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(80, 227, 194, 0.1) 0%, transparent 50%)',
                pointerEvents: 'none'
            }}
        >
            {/* Header */}
            <Header />

            {/* Main Content */}
            <Box pt="120px" pb={8} px={4} position="relative" zIndex={1}>
                <VStack spacing={8} maxW="800px" mx="auto">

                    {/* Action Buttons */}
                    <HStack spacing={4} justify="center" w="100%">
                        <Button
                            onClick={handleRefresh}
                            isLoading={isLoading}
                            loadingText="Refreshing..."
                            bg="linear-gradient(45deg, rgba(74, 144, 226, 0.9) 0%, rgba(80, 227, 194, 0.9) 100%)"
                            color="white"
                            size="lg"
                            _hover={{
                                transform: "translateY(-2px)",
                                boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)"
                            }}
                            _active={{ transform: "translateY(0)" }}
                            transition="all 0.2s ease"
                            borderRadius="xl"
                            px={8}
                            fontWeight="bold"
                        >
                            🔄 Refresh All
                        </Button>

                        <Button
                            onClick={() => setShowSettings(true)}
                            variant="outline"
                            borderColor="rgba(74, 144, 226, 0.5)"
                            color="gray.700"
                            size="lg"
                            _hover={{
                                bg: "rgba(74, 144, 226, 0.1)",
                                transform: "translateY(-2px)",
                                boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)"
                            }}
                            _active={{ transform: "translateY(0)" }}
                            transition="all 0.2s ease"
                            borderRadius="xl"
                            px={8}
                            fontWeight="bold"
                        >
                            ⚙️ Settings
                        </Button>
                    </HStack>

                    {/* Glass Cards Section - Using your existing GlassCard component */}
                    <VStack spacing={6} w="100%">
                        {/* Main Glass Card with Quote and Weather */}
                        <Box w="100%" maxW="500px">
                            <GlassCard
                                quote={quote}
                                weather={weather}
                            />
                        </Box>

                        {/* Additional Quote Widget (if you want separate display) */}
                        <Box w="100%" maxW="600px">
                            <QuoteWidget quote={quote} author={author} />
                        </Box>

                        {/* Weather Widget (if you want separate display) */}
                        <Box w="100%" maxW="400px">
                            <WeatherWidget weather={weather} />
                        </Box>
                    </VStack>

                    {/* Loading Indicator */}
                    {isLoading && (
                        <Box
                            position="fixed"
                            top="50%"
                            left="50%"
                            transform="translate(-50%, -50%)"
                            bg="rgba(255, 255, 255, 0.9)"
                            backdropFilter="blur(10px)"
                            borderRadius="lg"
                            p={4}
                            boxShadow="0 8px 32px rgba(0, 0, 0, 0.2)"
                            zIndex={1500}
                        >
                            <VStack spacing={2}>
                                <Box
                                    w={8}
                                    h={8}
                                    border="2px solid"
                                    borderColor="blue.200"
                                    borderTopColor="blue.500"
                                    borderRadius="full"
                                    animation="spin 1s linear infinite"
                                />
                                <Box fontSize="sm" color="gray.600" fontWeight="medium">
                                    Loading...
                                </Box>
                            </VStack>
                        </Box>
                    )}
                </VStack>
            </Box>

            {/* Settings Modal */}
            {showSettings && (
                <Settings onClose={() => setShowSettings(false)} />
            )}

            {/* Global Styles */}
            <style jsx global>{`
                @keyframes spin {
                    to {
                        transform: rotate(360deg);
                    }
                }
            `}</style>
        </Box>
    );
};

export default Home;