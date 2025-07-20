// src/Components/QuoteWidget.js
import React from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';

const QuoteWidget = ({ quote, author }) => {
    if (!quote) {
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
                    🔄 Loading inspiration...
                </Text>
            </Box>
        );
    }

    return (
        <Box
            bg="rgba(255, 255, 255, 0.1)"
            backdropFilter="blur(10px)"
            borderRadius="lg"
            p={6}
            border="1px solid rgba(255, 255, 255, 0.2)"
            position="relative"
            overflow="hidden"
            minHeight="160px"
            display="flex"
            alignItems="center"
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
            <VStack spacing={4} position="relative" zIndex={1} w="100%" textAlign="center">
                {/* Quote Icon */}
                <Text fontSize="3xl" role="img" aria-label="inspiration">
                    ✨
                </Text>

                {/* Quote Text */}
                <Box position="relative">
                    <Text
                        fontSize="lg"
                        fontStyle="italic"
                        color="gray.700"
                        lineHeight={1.6}
                        textAlign="center"
                        fontWeight="medium"
                        textShadow="0 1px 2px rgba(0, 0, 0, 0.1)"
                        position="relative"
                        _before={{
                            content: '"❝"',
                            position: 'absolute',
                            top: '-10px',
                            left: '-20px',
                            fontSize: '2xl',
                            color: 'rgba(74, 144, 226, 0.3)',
                            fontWeight: 'bold'
                        }}
                        _after={{
                            content: '"❞"',
                            position: 'absolute',
                            bottom: '-15px',
                            right: '-20px',
                            fontSize: '2xl',
                            color: 'rgba(74, 144, 226, 0.3)',
                            fontWeight: 'bold'
                        }}
                    >
                        {quote}
                    </Text>
                </Box>

                {/* Author */}
                {author && author !== 'Unknown' && (
                    <Box
                        mt={3}
                        pt={3}
                        borderTop="1px solid rgba(255, 255, 255, 0.2)"
                        w="100%"
                    >
                        <Text
                            fontSize="sm"
                            color="gray.600"
                            fontWeight="bold"
                            textTransform="uppercase"
                            letterSpacing="wide"
                            textAlign="right"
                        >
                            — {author}
                        </Text>
                    </Box>
                )}

                {/* Decorative Elements */}
                <Box
                    position="absolute"
                    top={2}
                    right={2}
                    opacity={0.3}
                >
                    <Text fontSize="sm" color="gray.400">
                        💫
                    </Text>
                </Box>

                <Box
                    position="absolute"
                    bottom={2}
                    left={2}
                    opacity={0.3}
                >
                    <Text fontSize="sm" color="gray.400">
                        🌟
                    </Text>
                </Box>
            </VStack>
        </Box>
    );
};

export default QuoteWidget;
