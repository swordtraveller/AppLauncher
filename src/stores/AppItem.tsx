class AppItem {
    public id: string;
    public name: string;
    public path: string;
    public icon: string;
    
    constructor(id: string, name: string, path: string, icon: string) {
        this.id = id;
        this.name = name;
        this.path = path;
        this.icon = icon;
    }
}

export default AppItem;