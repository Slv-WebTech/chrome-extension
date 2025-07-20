// src/components/Header.js
import React from 'react';
import { Flex, Button, Heading, Box } from '@chakra-ui/react';

const Header = () => {
   const handleRefresh = () => {
      window.location.reload();
   };

   return (
      <Box
         as="header"
         bg="linear-gradient(135deg, rgba(30, 58, 138, 1) 0%, rgba(79, 70, 229, 0.95) 25%, rgba(139, 69, 19, 0.9) 50%, rgba(220, 38, 127, 0.95) 75%, rgba(239, 68, 68, 1) 100%)"
         backdropFilter="blur(20px)"
         boxShadow="0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.4)"
         border="2px solid rgba(255, 255, 255, 0.3)"
         borderBottom="3px solid rgba(255, 255, 255, 0.5)"
         position="fixed"
         top={0}
         left={0}
         right={0}
         width="100vw"
         zIndex={1000}
         overflow="hidden"
         minHeight="15px"
         animation="headerPulse 4s ease-in-out infinite alternate"
         _before={{
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, rgba(255, 255, 255, 0.3) 0%, transparent 30%, rgba(255, 255, 255, 0.1) 60%, transparent 100%)',
            animation: 'shimmer 3s ease-in-out infinite',
            pointerEvents: 'none'
         }}
         _after={{
            content: '""',
            position: 'absolute',
            top: '-2px',
            left: '-2px',
            right: '-2px',
            bottom: '-2px',
            background: 'linear-gradient(45deg, #ff0066, #00ff66, #6600ff, #ff6600)',
            zIndex: -1,
            filter: 'blur(15px)',
            opacity: 0.7,
            animation: 'colorShift 5s ease-in-out infinite'
         }}
         sx={{
            '@keyframes headerPulse': {
               '0%': { transform: 'scale(1)', filter: 'brightness(1)' },
               '100%': { transform: 'scale(1.005)', filter: 'brightness(1.1)' }
            },
            '@keyframes shimmer': {
               '0%': { transform: 'translateX(-100%)' },
               '100%': { transform: 'translateX(100%)' }
            },
            '@keyframes colorShift': {
               '0%': { filter: 'hue-rotate(0deg) blur(15px)' },
               '25%': { filter: 'hue-rotate(90deg) blur(20px)' },
               '50%': { filter: 'hue-rotate(180deg) blur(15px)' },
               '75%': { filter: 'hue-rotate(270deg) blur(20px)' },
               '100%': { filter: 'hue-rotate(360deg) blur(15px)' }
            }
         }}
      >
         <Flex
            justifyContent="space-between"
            alignItems="center"
            px={2}
            py={0.5}
            position="relative"
            zIndex={1}
            maxW="100%"
            w="100%"
            minHeight="15px"
         >
            <Box transform="translateZ(0)" filter="drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4))">
               <Heading
                  fontSize="0.7rem"
                  color="white"
                  textShadow="0 4px 8px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 255, 255, 0.3)"
                  fontWeight="black"
                  letterSpacing="wider"
                  transform="perspective(500px) rotateX(5deg)"
                  transition="all 0.3s ease"
                  _hover={{
                     transform: "perspective(500px) rotateX(0deg) scale(1.05)",
                     textShadow: "0 6px 12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 255, 255, 0.5)"
                  }}
               >
                  ✨ DAILY BOOST ⚡
               </Heading>
            </Box>

            <Button
               onClick={handleRefresh}
               variant="solid"
               bg="linear-gradient(45deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%)"
               color="white"
               size="sm"
               _hover={{
                  bg: "linear-gradient(45deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.2) 100%)",
                  transform: "translateY(-1px) scale(1.03)",
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.4), 0 0 15px rgba(255, 255, 255, 0.3)",
                  filter: "brightness(1.2)"
               }}
               _active={{
                  transform: "translateY(0px) scale(1.01)",
                  bg: "linear-gradient(45deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.3) 100%)"
               }}
               transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
               borderRadius="xs"
               px={1.5}
               py={0.25}
               fontSize="0.5rem"
               fontWeight="black"
               textShadow="0 2px 4px rgba(0, 0, 0, 0.5)"
               border="1px solid rgba(255, 255, 255, 0.4)"
               backdropFilter="blur(10px)"
               position="relative"
               overflow="hidden"
               textTransform="uppercase"
               letterSpacing="wider"
               _before={{
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
                  transition: 'left 0.5s ease'
               }}
               _hover_before={{
                  left: '100%'
               }}
            >
               🔄 REFRESH
            </Button>
         </Flex>
      </Box>
   );
};

export default Header;
