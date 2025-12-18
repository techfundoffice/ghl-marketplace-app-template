import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { GHL } from "./ghl";

// AG Grid module registration (required for v35+)
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);

// AG Grid styles
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

const ghl = new GHL();
window.ghl = ghl;

createApp(App).use(router).mount("#app");
