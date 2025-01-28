# App Launcher

An App launcher.  

## Development Specifications

We don't have the energy to write a complete development specification yet. At this stage, we ensure compliance through code review.  
However, we will use some reference materials:  
- [Google HTML/CSS Style Guide](https://google.github.io/styleguide/htmlcssguide.html)
- [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- [Airbnb React Style Guide](https://github.com/airbnb/javascript/tree/master/react)
- [Angular Commit Message Format](https://gist.github.com/brianclements/841ea7bffdb01346392c)

Maybe in the future, we will introduce some linters and formatters to solve the problem to some extent.  

## How to Run the Project

Note:  
> 开发期间需要先自己建好 `~\AppData\Roaming\applauncher.io.github.swordtraveller` 目录，这个目录是与 tauri 包名相对应的，否则无法创建持久化所需的文件。  

The following script is based on Windows Powershell test, using pnpm as the package manager:  

```powershell
pnpm install
pnpm tauri dev
```

It may work on other platforms, using other package managers, but this has not been tested.  
