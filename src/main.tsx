import ReactDOM from "react-dom/client";
import { FluentProvider } from '@fluentui/react-components';

import App from "./App";
import myTheme from "./themes/myTheme";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  // 默认是webLightTheme，这里我们也可以复制一份稍加修改为myTheme
  <FluentProvider theme={myTheme}>
    <App />
  </FluentProvider>
);
