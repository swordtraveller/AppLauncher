import { useEffect, useState } from "react";
import type {
  SelectTabData,
  SelectTabEvent,
  TabValue,
  TabListProps,
} from "@fluentui/react-components";
import { makeStyles, Button, Tab, TabList } from "@fluentui/react-components";
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
  Label,
} from "@fluentui/react-components";
import { AddSquareRegular, Delete16Regular, Rename16Regular } from '@fluentui/react-icons';
import { getCurrentWindow } from "@tauri-apps/api/window";
import { exit } from '@tauri-apps/plugin-process';
import { trace, info } from '@tauri-apps/plugin-log';
import { readTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';
import { v7 as uuidv7 } from 'uuid';
import TabContent from './components/TabContent/TabContent';
import useStore from "./stores/store";
import AppItem from "./stores/AppItem";
import TabItem from "./stores/TabItem";
import "./App.css";

function App(props: Partial<TabListProps>) {
  const [selectedValue, setSelectedValue] = useState<TabValue>("");
  const [newtabname, setNewtabname] = useState("");
  const [addtabname, setAddtabname] = useState("");
  const tabDict = useStore(state => state.tabDict);
  const addAppItem = useStore(state => state.addAppItem);
  const addTabItem = useStore(state => state.addTabItem);
  const delTabItem = useStore(state => state.delTabItem);
  const renameTabItem = useStore(state => state.renameTabItem);
  const saveData = useStore(state => state.saveData);

  const [isTabItemMenuOpen] = useState<Map<string, boolean>>(new Map<string, boolean>);

  const onTabSelect = (event: SelectTabEvent, data: SelectTabData) => {
    trace("event: " + event)
    trace("data.value: " + data.value);
    setSelectedValue(data.value);
  };

  const handleAddTabItem = (ev: React.FormEvent) => {
    ev.preventDefault();
    const newTabItem = new TabItem(addtabname);
    info("newTabItem.name: " + newTabItem.name);
    const tabId = uuidv7();
    addTabItem(tabId, newTabItem);
    setSelectedValue(tabId);
  };

  const handleDeleteTabItem = (tabId: string) => {
    delTabItem(tabId);
  }

  const handleRenameTabItem = (ev: React.FormEvent, tabId: string) => {
    ev.preventDefault();
    if (newtabname == "") {
      // do nothing
    } else {
      renameTabItem(tabId, newtabname);
    }
  };

  const handleInputNewtabname = (ev: React.FormEvent, data: any) => {
    trace("ev: " + ev);
    setNewtabname(data.value);
  }

  const handleInputAddtabname = (ev: React.FormEvent, data: any) => {
    trace("ev: " + ev);
    setAddtabname(data.value);
  }

  const onTabItemMenuOpenChange: (tabId: string) => MenuProps['onOpenChange'] = (tabId: string) => (e: any, data: any) => {
    info("onTabItemMenuOpenChange");
    info("data.open: " + data.open);
    trace("e: " + e);
    trace("tabId: " + tabId);
    // change the reference of map
    isTabItemMenuOpen.forEach((value: boolean, key: string) => {
      info("isTabItemMenuOpen["+key+"]:"+String(value));
    });
  }

  const styles = useStyles();

  let unlistenWindowCloseEvent: any = null;

  useEffect(() => {
    info("useEffect");

    readTextFile(
      String("tabDict.json"),
      {
        baseDir: BaseDirectory.AppData,
      }
    ).then(contents => {
      info("contents");
      info(contents);
      const tabDictList: TabItem[] = JSON.parse(contents);
      info("tabDictList");
      tabDictList.forEach((tabItem) => {
        addTabItem(uuidv7(), tabItem);
      });
    }).catch(error => {
      error(error);
    });

    readTextFile(
      String("appDict.json"),
      {
        baseDir: BaseDirectory.AppData,
      }
    ).then(contents => {
      info("contents");
      info(contents);
      const appDictList: AppItem[] = JSON.parse(contents);
      info("appDictList");
      appDictList.forEach((appItem) => {
        addAppItem(uuidv7(), appItem.id, appItem);
      });
    }).catch(error => {
      error(error);
    });

    const setupListener = async () => {
      // 监听窗口关闭请求事件
      unlistenWindowCloseEvent = await getCurrentWindow().onCloseRequested(async () => {
        await saveData();
        // 注意不要用 close()，它只是再一次发出closeRequested事件，然后又被这里的listener捕获
        // destroy() 也没有效果，原因不明
        info("User exit the app");
        await exit(0);
      });
      // 以后调用unlistenWindowCloseEvent()可以卸载监听
    }

    try {
      setupListener();
    } catch (error) {

    }

    // 组件卸载时，移除事件监听器
    return () => {
        info("卸载");
        info("移除监听");
        unlistenWindowCloseEvent();
    };

  }, []);

  return (
    <main>
      <div className={styles.root}>
        <TabList selectedValue={selectedValue} onTabSelect={onTabSelect} {...props} style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
          {[...tabDict].map(([tabId, tabItem]) => (
            // use persistOnItemClick to pop up a dialog when clicking a menu option
            <Menu positioning={{ autoSize: true }} openOnContext={true} persistOnItemClick={true} open={isTabItemMenuOpen.get(tabId)!} onOpenChange={onTabItemMenuOpenChange(tabId)}>
            <MenuTrigger disableButtonEnhancement>
              <div>
                {/* value is tabId not tabItem.name */}
                <Tab key={tabId} value={tabId}>{tabItem.name}</Tab>
              </div>
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem icon={<Delete16Regular />} onClick={() => handleDeleteTabItem(tabId as string)}>删除</MenuItem>
                <Dialog modalType="non-modal">
                  <DialogTrigger disableButtonEnhancement>
                    <MenuItem icon={<Rename16Regular />}>重命名</MenuItem>
                  </DialogTrigger>
                  <DialogSurface aria-describedby={undefined}>
                    <form onSubmit={(ev) => handleRenameTabItem(ev, tabId)}>
                      <DialogBody>
                        <DialogTitle>标签重命名</DialogTitle>
                        <DialogContent className={styles.content}>
                          <Label required htmlFor={"newtabname-input"}>
                            请在下方输入新名称：
                          </Label>
                          <Input required id={"newtabname-input"} onChange={handleInputNewtabname} defaultValue={tabItem.name} />
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
              </MenuList>
            </MenuPopover>
          </Menu>
          ))}
          <Dialog modalType="non-modal">
            <DialogTrigger disableButtonEnhancement>
            <Button style={{ border: 'none', backgroundColor: 'transparent' }} icon={<AddSquareRegular />} />
            </DialogTrigger>
            <DialogSurface aria-describedby={undefined}>
              <form onSubmit={(ev) => handleAddTabItem(ev)}>
                <DialogBody>
                  <DialogTitle>新建标签</DialogTitle>
                  <DialogContent className={styles.content}>
                    <Label required htmlFor={"addtabname-input"}>
                      请在下方输入标签名称：
                    </Label>
                    <Input required id={"addtabname-input"} onChange={handleInputAddtabname}/>
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
        </TabList>
        {tabDict.size > 0 ? (
          <TabContent tabId={selectedValue as string} />
        ):(
          <div>
            当前无标签页。请点击上方的
            <AddSquareRegular className={styles.icon14} />
            以添加标签页
          </div>
        )}
      </div>
    </main>
  );
}

const useStyles = makeStyles({
  root: {
    alignItems: "flex-start",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    padding: "0px 20px",
    rowGap: "20px",
    backgroundColor: "transparent",
  },
  icon14: { fontSize: "14px" },
  content: {
    display: "flex",
    flexDirection: "column",
    rowGap: "10px",
  },
});

export default App;
