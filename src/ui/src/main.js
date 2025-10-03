import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { GHL } from "./ghl";

const ghl = new GHL();
window.ghl = ghl;

createApp(App).use(router).mount("#app");
