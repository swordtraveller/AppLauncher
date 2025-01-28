class TabItem {
    public name: string;
    public appIds: string[];
    
    constructor(name: string) {
        this.name = name;
        this.appIds = [];
    }

    public addAppId(appId: string) {
        this.appIds = [...this.appIds, appId];
    }
}

export default TabItem;