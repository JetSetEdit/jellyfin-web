import React, { StrictMode, useCallback, useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import { type Theme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import useScrollTrigger from '@mui/material/useScrollTrigger';
import { Outlet, useLocation } from 'react-router-dom';

import AppBody from 'components/AppBody';
import CustomCss from 'components/CustomCss';
import ThemeCss from 'components/ThemeCss';
import { useApi } from 'hooks/useApi';

import AppToolbar from './components/AppToolbar';
import AppDrawer, { isDrawerPath } from './components/drawers/AppDrawer';

import './AppOverrides.scss';

export const Component = () => {
    const [ isDrawerActive, setIsDrawerActive ] = useState(false);
    const { user } = useApi();
    const location = useLocation();

    const isMediumScreen = useMediaQuery((t: Theme) => t.breakpoints.up('md'));
    const isDrawerAvailable = isDrawerPath(location.pathname) && Boolean(user) && !isMediumScreen;
    const isDrawerOpen = isDrawerActive && isDrawerAvailable;

    // Transparent navbar only on home (hero shows through); always dark on library pages
    const isHomePage = location.pathname === '/home';
    const scrolled = useScrollTrigger({ disableHysteresis: true, threshold: 10 });
    const isTransparent = isHomePage && !scrolled;

    const onToggleDrawer = useCallback(() => {
        setIsDrawerActive(!isDrawerActive);
    }, [ isDrawerActive, setIsDrawerActive ]);

    return (
        <>
            <Box sx={{ position: 'relative', display: 'flex', height: '100%' }}>
                <StrictMode>
                    <AppBar
                        position='fixed'
                        elevation={0}
                        sx={{
                            width: '100%',
                            ml: 0,
                            color: 'rgba(255, 255, 255, 0.95)',
                            backgroundColor: isTransparent
                                ? 'transparent'
                                : 'rgba(6, 13, 26, 0.96)',
                            backdropFilter: isTransparent ? 'none' : 'blur(14px)',
                            WebkitBackdropFilter: isTransparent ? 'none' : 'blur(14px)',
                            transition: 'background-color 350ms ease, backdrop-filter 350ms ease',
                            // Soft gradient bleed below navbar on the hero — avoids a hard-cut edge
                            '&::after': {
                                content: '""',
                                position: 'absolute',
                                bottom: '-48px',
                                left: 0,
                                right: 0,
                                height: '48px',
                                background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), transparent)',
                                pointerEvents: 'none',
                                opacity: isTransparent ? 1 : 0,
                                transition: 'opacity 350ms ease'
                            }
                        }}
                    >
                        <AppToolbar
                            isDrawerAvailable={!isMediumScreen && isDrawerAvailable}
                            isDrawerOpen={isDrawerOpen}
                            onDrawerButtonClick={onToggleDrawer}
                        />
                    </AppBar>

                    {
                        isDrawerAvailable && (
                            <AppDrawer
                                open={isDrawerOpen}
                                onClose={onToggleDrawer}
                                onOpen={onToggleDrawer}
                            />
                        )
                    }
                </StrictMode>

                <Box
                    component='main'
                    sx={{
                        width: '100%',
                        flexGrow: 1
                    }}
                >
                    <AppBody>
                        <Outlet />
                    </AppBody>
                </Box>
            </Box>
            <ThemeCss />
            <CustomCss />
        </>
    );
};
