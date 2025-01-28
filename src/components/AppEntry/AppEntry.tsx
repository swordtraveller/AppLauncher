import React from 'react';
import { makeStyles } from "@fluentui/react-components";
import { invoke } from "@tauri-apps/api/core";
import { trace } from '@tauri-apps/plugin-log';

interface AppEntryProps {
    name?: string;
    path?: string;
    icon?: string;
    className?: string;
}

const AppEntry: React.FC<AppEntryProps> = ({ name, path, icon, className }) => {

    const styles = useStyles();
    
    const launchApp = () => {
        invoke<string>("launch_app", { path }).then((text) => {
            trace("launch" + text);
        });
    }
    
    return(
        <div className={className}>
            <button onClick={launchApp} className={styles.button} style={{ border: 'none', backgroundColor: 'transparent' }} >
                <img src={`data:image/png;base64, ${icon}`} alt="Icon Not Found" />
            </button>
            <p>{name}</p>
        </div>
    );
    
};

const useStyles = makeStyles({
    button: {
        '&:hover': {
            cursor: 'pointer',
        }
    },
});

export default AppEntry;