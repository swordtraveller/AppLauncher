import { useState, useEffect } from 'react';
import React from 'react';
import { v7 as uuidv7 } from 'uuid';
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { trace, info } from '@tauri-apps/plugin-log';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from "@tauri-apps/api/core";
import { makeStyles } from "@fluentui/react-components";
import {
    Menu,
    MenuTrigger,
    MenuList,
    MenuItem,
    MenuPopover,
    MenuProps,
  } from "@fluentui/react-components";
  import {
    Dialog,
    DialogTrigger,
    DialogSurface,
    DialogTitle,
    DialogContent,
    DialogBody,
    DialogActions,
    Input,
    Button,
    Label,
  } from "@fluentui/react-components";
import { AddRegular, Delete16Regular, Rename16Regular } from '@fluentui/react-icons';
import AppItem from '../../stores/AppItem';
import useStore from '../../stores/store';
import './TabContent.css';
import AppEntry from '../AppEntry/AppEntry';
import TabItem from '../../stores/TabItem';

interface TabProps {
    tabId: string;
}

const TabContent: React.FC<TabProps> = ({ tabId }) => {

    const styles = useStyles();

    const tabDict = useStore(state => state.tabDict);
    const appDict = useStore(state => state.appDict);
    
    
    const tabItem: TabItem = tabDict.get(tabId) as TabItem;
    let appIds: string[] = [];
    if (tabItem != undefined) {
        appIds = tabItem?.appIds;
    }
    const appList = appIds?.map((key) => appDict.get(key));
    const addAppItem = useStore(state => state.addAppItem);
    const delAppItem = useStore(state => state.delAppItem);
    const renameAppItem = useStore(state => state.renameAppItem);

    const [newappname, setNewappname] = useState("");
    const [
        isAppEntryMenuOpen,
        // setAppEntryMenuOpen
    ] = useState<Map<string, boolean>>(new Map<string, boolean>);
    
    // const updateAppEntryMenuOpen = (tabId: string, value: boolean) => {
    //     const newMap = new Map(isAppEntryMenuOpen);
    //     newMap.set(tabId, value);
    //     setAppEntryMenuOpen(newMap);
    // }

    let unlisten: any = null;

    const imgPathToBase64 = async (path: string) => {
        return await invoke<string>("img_path_to_base64", { path });
    }
    
    useEffect(() => {

        const setupListener = async () => {
            // 监听文件拖拽事件
            info("start to register onDragDropEvent");
            unlisten = await getCurrentWebview().onDragDropEvent( async (event) => {
                // event.payload.type 取值如下
                // 悬停 over, 释放 drop, 都不是就是取消了
                // 这个监听需要限制在组件当中
                if (event.payload.type === 'drop') {
                    // event.payload.position 物理坐标
                    // event.payload.paths 一组路径
                    event.payload.paths.forEach(path => {
                        info("onDragDropEvent happened: " + path);
                        imgPathToBase64(path).then(base64 => {
                            const appId = uuidv7();
                            const newAppItem = new AppItem(
                                appId,
                                getFilename(path),
                                path,
                                base64,
                            );
                            addAppItem(tabId as string, appId, newAppItem);
                        }).catch(error => {
                            error(error);
                        });
                    });
                }
            });
            info("finish registering onDragDropEvent");
            // 以后调用unlisten()可以卸载监听
        }

        try {
            setupListener();
        } catch (error) {
            
        }

        // 组件卸载时，移除事件监听器
        return () => {
            info("卸载");
            info("移除监听");
            unlisten();
        };

    }, []) // 空依赖数组

    const handleClickAddButton = async () => {
        try {
            const file = await open({
                multiple: false,
                directory: false,
            });
            if (file == undefined) {
                info("No items selected.");
            } else {
                let path = cleanPath(file.toString());
                info("path: " + path);
                let base64: string = await imgPathToBase64(path);
                // info("base64: " + base64);
                const appId = uuidv7();
                const newAppItem = new AppItem(
                    appId,
                    getFilename(path),
                    path,
                    base64,
                );
                addAppItem(tabId as string, appId, newAppItem);
            }
        } catch (error) {
            info("An error occurred while selecting the file: " + error);
        }
        
    }

    const cleanPath = (path: string) => {
        // 清理两头的"
        if (path.startsWith('"')) {
            path = path.slice(1);
        }
        if (path.endsWith('"')) {
            path = path.substring(0, path.length - 1);
        }
        // 如果不是，返回原字符串
        return path;
    }

    // "D:\\Program Files\\Microsoft VS Code\\Code.exe" => "Code"
    const getFilename = (path: string) => {
        let fileName = path.split('\\').pop();
        if (fileName == undefined) {
            return path;
        } else {
            const exeSuffix =  ".exe";
            if (fileName.endsWith(exeSuffix)) {
                fileName = fileName.substring(0, fileName.length - exeSuffix.length);
            }
            return fileName;
        }
    }

    const handleDeleteAppEntry = (tabId: string, appId: string) => {
        delAppItem(tabId, appId);
    }

    const handleInputNewappname = (ev: React.FormEvent, data: any) => {
        trace("ev" + ev);
        setNewappname(data.value);
    }

    const handleRenameAppEntry = (ev: React.FormEvent, appId: string) => {
        ev.preventDefault();
        if (newappname == "") {
            // do nothing
        } else {
            renameAppItem(appId, newappname);
            // setSelectedValue(tabId);
        }
    };

    const onAppEntryMenuOpenChange: MenuProps["onOpenChange"] = (e, data) => {
        // setAppEntryMenuOpen(data.open);
        trace("e: " + e)
        trace("data: " + data)
    };

    return (
        <div className="container">
            {appList?.map((appItem) => (
                <Menu positioning={{ autoSize: true }} openOnContext={true} persistOnItemClick={true} open={isAppEntryMenuOpen.get(appItem!.id)} onOpenChange={onAppEntryMenuOpenChange}>
                <MenuTrigger disableButtonEnhancement>
                  <div>
                    <AppEntry className="item app-item" name={appItem?.name} path={appItem?.path} icon={appItem?.icon}/>
                  </div>
                </MenuTrigger>
                <MenuPopover>
                  <MenuList>
                    {/* 注意onClick不是写在icon里，是MenuItem里 */}
                    <MenuItem icon={<Delete16Regular />} onClick={() => handleDeleteAppEntry(tabId as string, appItem!.id)}>删除</MenuItem>
                    <Dialog modalType="non-modal">
                    <DialogTrigger disableButtonEnhancement>
                        <MenuItem icon={<Rename16Regular />}>重命名</MenuItem>
                    </DialogTrigger>
                    <DialogSurface aria-describedby={undefined}>
                    <form onSubmit={(ev) => handleRenameAppEntry(ev, appItem!.id)}>
                        <DialogBody>
                            <DialogTitle>应用重命名</DialogTitle>
                            <DialogContent className={styles.content}>
                            <Label required htmlFor={"newappname-input"}>
                                请在下方输入新名称：
                            </Label>
                            <Input required id={"newappname-input"} onChange={handleInputNewappname} defaultValue={appItem!.name} />
                            </DialogContent>
                            <DialogActions>
                            <DialogTrigger disableButtonEnhancement>
                                <Button appearance="secondary">取消</Button>
                            </DialogTrigger>
                            <DialogTrigger disableButtonEnhancement>
                                <Button type="submit" appearance="primary">确认</Button>
                            </DialogTrigger>
                            </DialogActions>
                        </DialogBody>
                        </form>
                    </DialogSurface>
                    </Dialog>
                    {/* <MenuItem icon={<ArrowTurnRight16Regular />}>更改路径</MenuItem> */}
                  </MenuList>
                </MenuPopover>
              </Menu>
            ))}
            <div className="item">
                <button onClick={handleClickAddButton} className={styles.button_add_item} >
                    <AddRegular className={styles.icon_add_item} />
                </button>
                <p></p>
            </div>
        </div>
    );

};

const useStyles = makeStyles({
    icon_add_item: { fontSize: "3rem", color: "gray" },
    button_add_item: {
        border: '0.1rem dotted gray',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            cursor: 'pointer',
        }
    },
    content: {
        display: "flex",
        flexDirection: "column",
        rowGap: "10px",
    },
});

export default TabContent;