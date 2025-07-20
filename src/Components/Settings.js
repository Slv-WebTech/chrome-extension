// src/Components/Settings.js
import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    Heading,
    Input,
    Button,
    Text,
    HStack,
    Badge,
    Card,
    CardHeader,
    CardBody,
    Separator
} from '@chakra-ui/react';
import { Field } from '@chakra-ui/react';
import { apiService } from '../ApiServices/Api';

const Settings = ({ onClose }) => {
    const [apiKey, setApiKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [settings, setSettings] = useState({});

    // Create a simple toast function since useToast is not available
    const showToast = (title, description, status) => {
        // Simple alert for now - you could implement a custom toast component
        const message = `${title}: ${description}`;
        if (status === 'error') {
            alert(`❌ ${message}`);
        } else {
            alert(`✅ ${message}`);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const currentSettings = await apiService.getSettings();
            setSettings(currentSettings);
            setApiKey(currentSettings.weatherApiKey || '');
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const handleSaveApiKey = async () => {
        if (!apiKey.trim()) {
            showToast('Error', 'Please enter a valid API key', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const success = await apiService.setWeatherApiKey(apiKey);

            if (success) {
                showToast('Success', 'Weather API key saved successfully!', 'success');

                // Refresh weather data with new API key
                await apiService.refreshWeather();
            } else {
                throw new Error('Failed to save API key');
            }
        } catch (error) {
            showToast('Error', 'Failed to save API key. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefreshData = async () => {
        setIsLoading(true);
        try {
            await Promise.all([
                apiService.refreshQuote(),
                apiService.refreshWeather()
            ]);

            showToast('Success', 'Data refreshed successfully!', 'success');
        } catch (error) {
            showToast('Error', 'Failed to refresh data. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="rgba(0, 0, 0, 0.5)"
            backdropFilter="blur(5px)"
            zIndex={2000}
            display="flex"
            alignItems="center"
            justifyContent="center"
            p={4}
        >
            <Card
                maxW="500px"
                w="100%"
                bg="rgba(255, 255, 255, 0.95)"
                backdropFilter="blur(20px)"
                boxShadow="0 20px 50px rgba(0, 0, 0, 0.3)"
                border="2px solid rgba(255, 255, 255, 0.3)"
                borderRadius="xl"
                overflow="hidden"
            >
                <CardHeader
                    bg="linear-gradient(135deg, rgba(74, 144, 226, 0.9) 0%, rgba(80, 227, 194, 0.9) 100%)"
                    color="white"
                    py={6}
                >
                    <HStack justify="space-between" align="center">
                        <Heading size="lg" textShadow="0 2px 4px rgba(0, 0, 0, 0.3)">
                            ⚙️ Settings
                        </Heading>
                        <Button
                            variant="ghost"
                            color="white"
                            onClick={onClose}
                            _hover={{ bg: "rgba(255, 255, 255, 0.2)" }}
                            size="sm"
                        >
                            ✕
                        </Button>
                    </HStack>
                </CardHeader>

                <CardBody p={6}>
                    <VStack spacing={6} align="stretch">
                        {/* Weather API Key Section */}
                        <Box>
                            <Field.Root>
                                <Field.Label color="gray.700" fontWeight="bold">
                                    🌤️ OpenWeatherMap API Key
                                </Field.Label>
                                <Input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="Enter your OpenWeatherMap API key"
                                    bg="white"
                                    border="2px solid"
                                    borderColor="gray.200"
                                    _focus={{
                                        borderColor: "blue.400",
                                        boxShadow: "0 0 0 1px rgba(74, 144, 226, 0.3)"
                                    }}
                                />
                                <Field.HelperText color="gray.600">
                                    Get your free API key from{' '}
                                    <Text as="span" color="blue.500" fontWeight="bold">
                                        openweathermap.org
                                    </Text>
                                </Field.HelperText>
                            </Field.Root>                            <Button
                                onClick={handleSaveApiKey}
                                isLoading={isLoading}
                                loadingText="Saving..."
                                bg="linear-gradient(45deg, rgba(74, 144, 226, 0.9) 0%, rgba(80, 227, 194, 0.9) 100%)"
                                color="white"
                                mt={3}
                                _hover={{
                                    transform: "translateY(-1px)",
                                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)"
                                }}
                                _active={{ transform: "translateY(0)" }}
                                transition="all 0.2s ease"
                            >
                                💾 Save API Key
                            </Button>
                        </Box>

                        <Separator />

                        {/* Status Section */}
                        <Box>
                            <Heading size="md" color="gray.700" mb={4}>
                                📊 Status
                            </Heading>
                            <VStack spacing={3} align="stretch">
                                <HStack justify="space-between">
                                    <Text>Weather API:</Text>
                                    <Badge
                                        colorScheme={settings.weatherApiKey ? "green" : "red"}
                                        px={3}
                                        py={1}
                                        borderRadius="full"
                                    >
                                        {settings.weatherApiKey ? "✅ Connected" : "❌ Not Set"}
                                    </Badge>
                                </HStack>

                                <HStack justify="space-between">
                                    <Text>Location:</Text>
                                    <Badge
                                        colorScheme={settings.userLocation ? "green" : "yellow"}
                                        px={3}
                                        py={1}
                                        borderRadius="full"
                                    >
                                        {settings.userLocation ? "📍 Detected" : "🔍 Detecting..."}
                                    </Badge>
                                </HStack>
                            </VStack>
                        </Box>

                        <Separator />

                        {/* Actions Section */}
                        <Box>
                            <Heading size="md" color="gray.700" mb={4}>
                                🔄 Actions
                            </Heading>
                            <VStack spacing={3}>
                                <Button
                                    onClick={handleRefreshData}
                                    isLoading={isLoading}
                                    loadingText="Refreshing..."
                                    variant="outline"
                                    colorScheme="blue"
                                    w="100%"
                                    _hover={{
                                        transform: "translateY(-1px)",
                                        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)"
                                    }}
                                >
                                    🔄 Refresh All Data
                                </Button>

                                <Button
                                    onClick={onClose}
                                    variant="ghost"
                                    colorScheme="gray"
                                    w="100%"
                                >
                                    ← Back to Dashboard
                                </Button>
                            </VStack>
                        </Box>
                    </VStack>
                </CardBody>
            </Card>
        </Box>
    );
};

export default Settings;
