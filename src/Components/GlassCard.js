// src/components/GlassCard.js
import React from 'react';
import PropTypes from 'prop-types';
import { Box, Text, VStack } from '@chakra-ui/react';

const GlassCard = ({ quote, weather }) => {
   return (
      <Box
         p={6}
         maxW="400px"
         borderRadius="lg"
         bg="rgba(255, 255, 255, 0.1)"
         backdropFilter="blur(10px)"
         boxShadow="0 8px 32px rgba(31, 38, 135, 0.37)"
         border="1px solid rgba(255, 255, 255, 0.18)"
         m="auto"
         mt={8}
         position="relative"
         overflow="hidden"
         _before={{
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 50%)',
            pointerEvents: 'none'
         }}
      >
         <VStack spacing={6} position="relative" zIndex={1}>
            {/* Quote Section */}
            <Box textAlign="center">
               <Text
                  fontSize="xl"
                  fontWeight="bold"
                  color="gray.700"
                  mb={3}
                  textShadow="0 1px 3px rgba(0, 0, 0, 0.1)"
               >
                  ✨ Daily Inspiration
               </Text>
               <Text
                  fontSize="md"
                  fontStyle="italic"
                  color="gray.600"
                  lineHeight={1.6}
                  textAlign="center"
                  px={2}
               >
                  "{quote || 'Loading inspirational quote...'}"
               </Text>
            </Box>

            {/* Divider */}
            <Box
               width="60%"
               height="1px"
               bg="rgba(255, 255, 255, 0.3)"
               borderRadius="full"
            />

            {/* Weather Section */}
            <Box textAlign="center">
               <Text
                  fontSize="lg"
                  fontWeight="bold"
                  color="gray.700"
                  mb={3}
                  textShadow="0 1px 3px rgba(0, 0, 0, 0.1)"
               >
                  🌤️ Weather Update
               </Text>
               <Text
                  fontSize="md"
                  color="gray.600"
                  fontWeight="medium"
               >
                  {weather?.city && weather?.temp
                     ? `${weather.city}: ${weather.temp}°C`
                     : 'Loading weather information...'
                  }
               </Text>
               {weather?.description && (
                  <Text
                     fontSize="sm"
                     color="gray.500"
                     mt={1}
                     textTransform="capitalize"
                  >
                     {weather.description}
                  </Text>
               )}
            </Box>
         </VStack>
      </Box>
   );
};
GlassCard.propTypes = {
   quote: PropTypes.string,
   weather: PropTypes.shape({
      city: PropTypes.string,
      temp: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      description: PropTypes.string
   })
};

export default GlassCard;
