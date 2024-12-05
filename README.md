# Todo Assignment System

   现阶段主要是先将主要功能利用起来。
   文件都是暂存。所以需要在日程安排后，及时保存。
   后续：

1. add Neon Serverless Function
2. add Authentication
3. Vercel Deployment

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

**  不需要特殊的wrangeler，直接push Github即可。

No configured name present, using `worker` as a prefix for the title

🌀 Creating namespace with title "worker-COMPLETION_TOKENS"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
[[kv_namespaces]]
binding = "COMPLETION_TOKENS"
id = "88e76b6ed66549869bf8db84b778ea0e"


本地运行 npm run dev:local
127.0.0.1:8788


wrangler.toml   保留

name = "todo-assignment-system"

compatibility_date = "2024-01-01"

[[d1_databases]]

binding = "DB"

database_name = "cfw-bun-hono-drizzle-d1"

database_id = "4ce62718-7b9a-4d8f-ad8a-740882958516"
