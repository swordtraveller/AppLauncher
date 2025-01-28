import { trace, info } from '@tauri-apps/plugin-log';
import { create as createFile, exists, writeTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';
import { create } from 'zustand';
import AppItem from './AppItem';
import TabItem from './TabItem';

type AppId = string;
type TabId = string;

interface StoreState {
    appDict: Map<AppId, AppItem>;
    tabDict: Map<TabId, TabItem>;

    addAppItem: (tabId: TabId, appId: AppId, appItem: AppItem) => void;
    delAppItem: (tabId: TabId, appId: AppId) => void;
    renameAppItem: (appId: AppId, newName: string) => void;
    addTabItem: (tabId: TabId, tabItem: TabItem) => void;
    delTabItem: (tabId: TabId) => void;
    renameTabItem: (tabId: TabId, newName: string) => void;
}

const saveAppDict = async (map: Map<AppId, AppItem>) => {
    // 持久化
    // 开发期间需要先自己建好 ~\AppData\Roaming\包名 目录以与 BaseDirectory.AppData 对应，否则 createFile() does nothing
    // Map不能被直接stringify()，这只会得到一个{}
    const filename = "appDict.json";
    const appItemList: AppItem[] = [];
    map.forEach((appItem, appId) => {
        trace("appId: " + appId);
        appItemList.push(appItem);
    });
    const content = JSON.stringify(appItemList);
    trace("content: " + content);

    const isExist = await exists(
        String(filename),
        {
            baseDir: BaseDirectory.AppData,
        }
    );
    if (isExist) {
        info("File already exists.");
    } else {
        info("File " + filename + " does not exist. File will be created.");
        const file = await createFile(
            String(filename),
            {
                baseDir: BaseDirectory.AppData,
            }
        );
        await file.close();
    }

    writeTextFile(
        String(filename),
        content,
        {
            baseDir: BaseDirectory.AppData,
        }
    ).then(writeResult => {
        trace("writeResult: " + String(writeResult));
        info("Persistence completed");
    }).catch(error => {
        error(filename + " persistence error");
        error(error);
    });
}

const saveTabDict = async (map: Map<TabId, TabItem>) => {
    // 持久化
    // 开发期间需要先自己建好 ~\TabData\Roaming\包名 目录以与 BaseDirectory.TabData 对应，否则 createFile() does nothing
    // Map不能被直接stringify()，这只会得到一个{}
    const filename = "TabDict.json";
    const TabItemList: TabItem[] = [];
    map.forEach((TabItem, TabId) => {
        trace("TabId: " + TabId);
        TabItemList.push(TabItem);
    });
    const content = JSON.stringify(TabItemList);
    info(content);

    const isExist = await exists(
        String(filename),
        {
            baseDir: BaseDirectory.AppData,
        }
    );
    if (isExist) {
        info("File already exists.");
    } else {
        info("File " + filename + " does not exist. File will be created.");
        const file = await createFile(
            String(filename),
            {
                baseDir: BaseDirectory.AppData,
            }
        );
        await file.close();
    }

    writeTextFile(
        String(filename),
        content,
        {
            baseDir: BaseDirectory.AppData,
        }
    ).then(writeResult => {
        trace("writeResult: " + String(writeResult));
        info("Persistence completed");
    }).catch(error => {
        error(filename + " persistence error");
        error(error);
    });
}

// zustand是浅比较，想要触发更新需要使得对象引用发生变化
const useStore = create<StoreState>()((set) => ({
    appDict: new Map<AppId, AppItem>,
    tabDict: new Map<TabId, TabItem>,

    addAppItem: (tabId: TabId, appId: AppId, appItem: AppItem) => set((state) => {
        state.appDict.set(appId, appItem);
        state.tabDict.forEach((tabItem, tabId) => {
            trace("tabId: " + tabId);
            tabItem.appIds.forEach((appId, index) => {
                trace("index: " + index)
                trace("appId:" + appId);
            })
        });
        state.tabDict.get(tabId)?.appIds.push(appId);
        state.tabDict.get(tabId)?.appIds.map((item) => {
            trace("item: " + item);
        })

        saveAppDict(state.appDict);
        saveTabDict(state.tabDict);
        return {
            appDict: new Map([...state.appDict]),
            tabDict: new Map([...state.tabDict]),
        }
    }),

    delAppItem: (tabId: TabId, appId: AppId) => set((state) => {
        // 注意：filter不会修改原数组，只会返回新数组
        const index = state.tabDict.get(tabId)?.appIds.findIndex(id => id === appId);
        if (index !== -1) {
            state.tabDict.get(tabId)?.appIds.splice(index!, 1);
        }
        state.appDict.delete(appId);

        saveAppDict(state.appDict);
        saveTabDict(state.tabDict);
        return {
            appDict: new Map([...state.appDict]),
            tabDict: new Map([...state.tabDict]),
        }
    }),

    renameAppItem: (appId: AppId, newName: string) => set((state) => {
        state.appDict.get(appId)!.name = newName;

        saveAppDict(state.appDict);
        saveTabDict(state.tabDict);
        return {
            appDict: new Map([...state.appDict]),
            tabDict: new Map([...state.tabDict]),
        }
    }),

    addTabItem: (tabId: TabId, tabItem: TabItem) => set((state) => {
        state.tabDict.set(tabId, tabItem);
        // 整体替换
        state.tabDict.forEach((tabItem, tabId) => {
            trace(tabId + ": " + tabItem.name);
            tabItem.appIds.forEach((appId, index) => {
                trace("index: " + index)
                trace("appId: " + appId);
            })
        });

        saveAppDict(state.appDict);
        saveTabDict(state.tabDict);
        return {
            appDict: new Map([...state.appDict]),
            tabDict: new Map([...state.tabDict]),
        }
    }),

    delTabItem: (tabId: TabId) => set((state) => {
        state.tabDict.delete(tabId);

        saveAppDict(state.appDict);
        saveTabDict(state.tabDict);
        return {
            appDict: new Map([...state.appDict]),
            tabDict: new Map([...state.tabDict]),
        }
    }),

    renameTabItem: (tabId: TabId, newName: string) => set((state) => {
        state.tabDict.get(tabId)!.name = newName;

        saveAppDict(state.appDict);
        saveTabDict(state.tabDict);
        return {
            appDict: new Map([...state.appDict]),
            tabDict: new Map([...state.tabDict]),
        }
    }),

}));

export default useStore;