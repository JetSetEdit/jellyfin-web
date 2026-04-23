import icon from 'assets/toolbar/server-icon.png';
import Button from '@mui/material/Button/Button';
import React, { FC } from 'react';
import { Link } from 'react-router-dom';

import { useSystemInfo } from 'hooks/useSystemInfo';

const ServerButton: FC = () => {
    const {
        data: systemInfo,
        isPending
    } = useSystemInfo();

    return (
        <Button
            variant='text'
            size='large'
            color='inherit'
            startIcon={
                <img
                    src={icon}
                    alt=''
                    aria-hidden
                    style={{
                        maxHeight: '2em',
                        maxWidth: '2em'
                    }}
                />
            }
            component={Link}
            to='/'
        >
            {isPending ? '' : (systemInfo?.ServerName || 'Jellyfin')}
        </Button>
    );
};

export default ServerButton;
