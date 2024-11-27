import { onRequestOptions as __api__middleware_js_onRequestOptions } from "D:\\demo\\Good-React-Todo Assignment\\Good-React-Todo Assignment\\todo-assignment-system\\functions\\api\\_middleware.js"
import { onRequest as __api__middleware_js_onRequest } from "D:\\demo\\Good-React-Todo Assignment\\Good-React-Todo Assignment\\todo-assignment-system\\functions\\api\\_middleware.js"

export const routes = [
    {
      routePath: "/api",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [__api__middleware_js_onRequestOptions],
      modules: [],
    },
  {
      routePath: "/api",
      mountPath: "/api",
      method: "",
      middlewares: [__api__middleware_js_onRequest],
      modules: [],
    },
  ]