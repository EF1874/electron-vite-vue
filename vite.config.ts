import {
    rmSync,
    mkdirSync,
    statSync,
    readdirSync,
    existsSync,
    cpSync
} from 'node:fs';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import pkg from './package.json';
import path from 'path';

// 调用示例

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
    rmSync('dist-electron', { recursive: true, force: true })

    const isServe = command === 'serve';
    const isBuild = command === 'build';
    const sourcemap = isServe || !!process.env.VSCODE_DEBUG;

    return {
        plugins: [
            vue(),
            electron([
                {
                    // Main-Process entry file of the Electron App.
                    entry: 'electron/main/index.ts',
                    onstart(options) {
                        if (process.env.VSCODE_DEBUG) {
                            console.log(
                                /* For `.vscode/.debug.script.mjs` */ '[startup] Electron App'
                            );
                        } else {
                            options.startup();
                        }
                    },
                    vite: {
                        build: {
                            sourcemap,
                            minify: isBuild,
                            outDir: 'dist-electron/main',
                            rollupOptions: {
                                external: Object.keys(
                                    'dependencies' in pkg
                                        ? pkg.dependencies
                                        : {}
                                )
                            }
                        }
                    }
                },
                {
                    entry: 'electron/preload/index.ts',
                    onstart(options) {
                        // Notify the Renderer-Process to reload the page when the Preload-Scripts build is complete,
                        // instead of restarting the entire Electron App.
                        options.reload();
                    },
                    vite: {
                        build: {
                            sourcemap: sourcemap ? 'inline' : undefined, // #332
                            minify: isBuild,
                            outDir: 'dist-electron/preload',
                            rollupOptions: {
                                external: Object.keys(
                                    'dependencies' in pkg
                                        ? pkg.dependencies
                                        : {}
                                )
                            }
                        }
                    }
                }
            ]),
            // Use Node.js API in the Renderer-process
            renderer()
        ],
        server:
            process.env.VSCODE_DEBUG &&
            (() => {
                const url = new URL(pkg.debug.env.VITE_DEV_SERVER_URL);
                return {
                    host: url.hostname,
                    port: +url.port
                };
            })(),
        clearScreen: false
    };
});

function _copyFolderSync(sourceFolder, destinationFolder) {
    // 检查目标文件夹是否存在，如果不存在则创建
    if (!existsSync(destinationFolder)) {
        mkdirSync(destinationFolder, { recursive: true });
    }

    // 读取源文件夹中的所有项
    const items = readdirSync(sourceFolder);

    // 复制每个文件到目标文件夹中
    items.forEach((item) => {
        const sourcePath = path.join(sourceFolder, item);
        const destinationPath = path.join(destinationFolder, item);

        // 检查是否是文件夹
        if (existsSync(destinationPath)) {
            return;
        }

        // 复制文件
        cpSync(sourcePath, destinationPath, { recursive: true, force: true });
    });
}

function _deleteFolderContentsExceptSubfolder(folderPath, subfolderName) {
    if (!existsSync(folderPath)) {
        return;
    }
    // 读取文件夹中的所有文件和子文件夹
    const files = readdirSync(folderPath);

    // 遍历文件夹中的所有文件和子文件夹
    files.forEach((file) => {
        const filePath = path.join(folderPath, file);

        // 判断当前项是文件还是文件夹
        if (statSync(filePath).isDirectory()) {
            // 如果是子文件夹且名称匹配，则跳过删除操作
            if (file === subfolderName) {
                return;
            }
        }

        // 删除文件或文件夹
        rmSync(filePath, { recursive: true, force: true });
    });
}