import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import Button from '@mui/material/Button';
import React from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';

import { appRouter } from 'components/router/appRouter';
import { useApi } from 'hooks/useApi';
import { useUserViews } from 'hooks/useUserViews';

// Binge-style: orange underline on active, white text, dimmed inactive
const BRAND_ORANGE = '#e05c2a';

const navSx = (isActive: boolean) => ({
    fontSize: '0.875rem',
    fontWeight: 600,
    textTransform: 'none' as const,
    letterSpacing: '0.01em',
    px: 1.5,
    py: 0,
    minWidth: 0,
    borderRadius: 0,
    color: isActive ? '#fff' : 'rgba(255,255,255,0.68)',
    // Underline indicator (Binge/Max pattern) — orange bar on active, transparent placeholder otherwise
    borderBottom: isActive ? `3px solid ${BRAND_ORANGE}` : '3px solid transparent',
    transition: 'color 200ms ease, border-color 200ms ease',
    '&:hover': {
        color: '#fff',
        borderColor: isActive ? BRAND_ORANGE : 'rgba(255,255,255,0.3)',
        backgroundColor: 'transparent'
    }
});

const CrabflixNav = () => {
    const { user } = useApi();
    const { data: userViews } = useUserViews(user?.Id);
    const location = useLocation();
    const [ searchParams ] = useSearchParams();

    const moviesLib = userViews?.Items?.find(v => v.CollectionType === CollectionType.Movies);
    const tvLib = userViews?.Items?.find(v => v.CollectionType === CollectionType.Tvshows);

    const moviesUrl = moviesLib
        ? appRouter.getRouteUrl(moviesLib, { context: moviesLib.CollectionType }).substring(1)
        : '/movies';
    const tvUrl = tvLib
        ? appRouter.getRouteUrl(tvLib, { context: tvLib.CollectionType }).substring(1)
        : '/tv';
    const collectionsUrl = moviesLib ? `${moviesUrl}&tab=3` : '/movies?tab=3';

    // Use library ID from query params for reliable active state across sub-routes
    const currentLibraryId = searchParams.get('topParentId');
    const isMoviesActive = moviesLib?.Id
        ? currentLibraryId === moviesLib.Id
        : location.pathname.startsWith('/movies');
    const isTvActive = tvLib?.Id
        ? currentLibraryId === tvLib.Id
        : location.pathname.startsWith('/tv');

    return (
        <>
            <Button
                variant='text'
                component={Link}
                to='/home'
                sx={navSx(location.pathname === '/home')}
                disableRipple
            >
                Home
            </Button>
            <Button
                variant='text'
                component={Link}
                to={moviesUrl}
                sx={navSx(isMoviesActive)}
                disableRipple
            >
                Movies
            </Button>
            <Button
                variant='text'
                component={Link}
                to={tvUrl}
                sx={navSx(isTvActive)}
                disableRipple
            >
                TV Shows
            </Button>
            <Button
                variant='text'
                component={Link}
                to={collectionsUrl}
                sx={navSx(false)}
                disableRipple
            >
                Collections
            </Button>
        </>
    );
};

export default CrabflixNav;
