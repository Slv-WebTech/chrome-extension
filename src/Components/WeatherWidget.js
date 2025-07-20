// src/Components/WeatherWidget.js
import React from 'react';
import { Box, Text, HStack, VStack } from '@chakra-ui/react';

const WeatherWidget = ({ weather }) => {
    const getWeatherIcon = (iconCode) => {
        // Map OpenWeatherMap icon codes to emojis
        const iconMap = {
            '01d': '☀️', // clear sky day
            '01n': '🌙', // clear sky night
            '02d': '⛅', // few clouds day
            '02n': '☁️', // few clouds night
            '03d': '☁️', // scattered clouds
            '03n': '☁️',
            '04d': '☁️', // broken clouds
            '04n': '☁️',
            '09d': '🌧️', // shower rain
            '09n': '🌧️',
            '10d': '🌦️', // rain day
            '10n': '🌧️', // rain night
            '11d': '⛈️', // thunderstorm
            '11n': '⛈️',
            '13d': '🌨️', // snow
            '13n': '🌨️',
            '50d': '🌫️', // mist
            '50n': '🌫️'
        };

        return iconMap[iconCode] || '🌤️';
    };

    const getTemperatureColor = (temp) => {
        if (typeof temp !== 'number') return 'gray.600';

        if (temp <= 0) return 'blue.400';
        if (temp <= 10) return 'blue.300';
        if (temp <= 20) return 'green.400';
        if (temp <= 30) return 'yellow.400';
        return 'red.400';
    };

    const formatWindSpeed = (speed) => {
        if (typeof speed !== 'number') return '--';
        return `${speed.toFixed(1)} m/s`;
    };

    if (!weather) {
        return (
            <Box
                bg="rgba(255, 255, 255, 0.1)"
                backdropFilter="blur(10px)"
                borderRadius="lg"
                p={4}
                border="1px solid rgba(255, 255, 255, 0.2)"
                textAlign="center"
            >
                <Text color="gray.500" fontSize="sm">
                    🔄 Loading weather...
                </Text>
            </Box>
        );
    }

    return (
        <Box
            bg="rgba(255, 255, 255, 0.1)"
            backdropFilter="blur(10px)"
            borderRadius="lg"
            p={5}
            border="1px solid rgba(255, 255, 255, 0.2)"
            position="relative"
            overflow="hidden"
            _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 50%)',
                pointerEvents: 'none'
            }}
        >
            <VStack spacing={4} position="relative" zIndex={1}>
                {/* Main Weather Display */}
                <HStack spacing={4} align="center">
                    <Text fontSize="4xl" role="img" aria-label="weather icon">
                        {getWeatherIcon(weather.icon)}
                    </Text>

                    <VStack spacing={1} align="flex-start">
                        <Text
                            fontSize="2xl"
                            fontWeight="bold"
                            color={getTemperatureColor(weather.temp)}
                            textShadow="0 1px 3px rgba(0, 0, 0, 0.3)"
                        >
                            {weather.temp}°C
                        </Text>
                        <Text
                            fontSize="sm"
                            color="gray.600"
                            fontWeight="medium"
                            textTransform="capitalize"
                        >
                            {weather.description}
                        </Text>
                    </VStack>
                </HStack>

                {/* Location */}
                <Text
                    fontSize="lg"
                    fontWeight="bold"
                    color="gray.700"
                    textAlign="center"
                    textShadow="0 1px 2px rgba(0, 0, 0, 0.2)"
                >
                    📍 {weather.city}
                </Text>

                {/* Weather Details */}
                <HStack spacing={6} justify="center" w="100%">
                    <VStack spacing={1}>
                        <Text fontSize="xs" color="gray.500" fontWeight="bold">
                            HUMIDITY
                        </Text>
                        <HStack spacing={1}>
                            <Text fontSize="xl" role="img" aria-label="humidity">
                                💧
                            </Text>
                            <Text fontSize="sm" fontWeight="bold" color="gray.600">
                                {weather.humidity}%
                            </Text>
                        </HStack>
                    </VStack>

                    <Box width="1px" height="40px" bg="rgba(255, 255, 255, 0.3)" />

                    <VStack spacing={1}>
                        <Text fontSize="xs" color="gray.500" fontWeight="bold">
                            WIND
                        </Text>
                        <HStack spacing={1}>
                            <Text fontSize="xl" role="img" aria-label="wind">
                                💨
                            </Text>
                            <Text fontSize="sm" fontWeight="bold" color="gray.600">
                                {formatWindSpeed(weather.windSpeed)}
                            </Text>
                        </HStack>
                    </VStack>
                </HStack>

                {/* Weather Status Indicator */}
                <Box
                    w="100%"
                    h="2px"
                    bg="linear-gradient(90deg, rgba(74, 144, 226, 0.3) 0%, rgba(80, 227, 194, 0.3) 100%)"
                    borderRadius="full"
                />
            </VStack>
        </Box>
    );
};

export default WeatherWidget;
