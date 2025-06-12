const router = require("express").Router();
const log = require("../../utils/logger");
const { readdirSync, readFileSync, existsSync } = require('fs-extra');
const path = require('path');
const chokidar = require('chokidar');

let loadedRoutes = {};
let hiddenRoutes = new Set();

// Load hidden routes configuration
function loadHiddenRoutes() {
    const hiddenPath = path.join(process.cwd(), "/Main/lib/.hidden/config.json");
    try {
        if (existsSync(hiddenPath)) {
            const hiddenConfig = JSON.parse(readFileSync(hiddenPath, 'utf8'));
            hiddenRoutes = new Set(hiddenConfig.hiddenRoutes || []);
            log(`Loaded ${hiddenRoutes.size} hidden routes`, 'HIDDEN');
        }
    } catch (error) {
        log(`Error loading hidden routes config: ${error.message}`, 'ERROR');
    }
}

function loadRoute(filePath, category) {
    try {
        // Clear require cache để reload module
        delete require.cache[require.resolve(filePath)];
        
        const fileContent = readFileSync(filePath, 'utf8');
        const route = require(filePath);
        
        if (route.name && route.index) {
            // Support multiple HTTP methods
            router.get(route.name, route.index);
            router.put(route.name, route.index);
            router.post(route.name, route.index);
            router.delete(route.name, route.index);

            // Kiểm tra xem route có bị ẩn không
            const isHidden = hiddenRoutes.has(route.name) || 
                           route.name.includes('/raw') || 
                           route.name.includes('/upcode/raw') ||
                           category === '.hidden';

            if (isHidden) {
                log(`Hidden route loaded: ${route.name}`, 'HIDDEN');
                return true; // Load route nhưng không hiển thị trong danh sách
            }

            const paramMatch = fileContent.match(/req\.query\.(\w+)/g);
            const params = paramMatch ? [...new Set(paramMatch.map(p => p.replace('req.query.', '')))] : [];

            if (!loadedRoutes[category]) {
                loadedRoutes[category] = [];
            }
            
            // Kiểm tra xem route đã tồn tại chưa (để tránh duplicate khi reload)
            const existingIndex = loadedRoutes[category].findIndex(r => r.name === route.name);
            const routeData = {
                name: route.name,
                params: params,
                lastModified: new Date().toISOString()
            };
            
            if (existingIndex >= 0) {
                loadedRoutes[category][existingIndex] = routeData;
                log(`Route updated: ${route.name}`, 'RELOAD');
            } else {
                loadedRoutes[category].push(routeData);
                log(`Route loaded: ${route.name}`, 'LOAD');
            }
            
            return true;
        } else {
            log(`Lỗi: File ${filePath} không có cấu trúc hợp lệ (thiếu name hoặc index)`, 'ERROR');
            return false;
        }
    } catch (error) {
        log(`Lỗi khi load file ${filePath}: ${error.message}`, 'ERROR');
        return false;
    }
}

function loadAllRoutes() {
    try {
        // Clear existing routes
        loadedRoutes = {};
        
        // Load hidden routes config first
        loadHiddenRoutes();
        
        let n = 0;
        let srcPath = path.join(process.cwd(), "/Main/lib/");

        // Load các file trực tiếp trong thư mục lib
        const hosting = readdirSync(srcPath).filter((file) => file.endsWith(".js"));
        for (let file of hosting) {
            if (loadRoute(path.join(srcPath, file), 'Khác')) n++;
        }

        // Load các file trong các thư mục con (bỏ thư mục .hidden)
        const getDirs = readdirSync(srcPath)
            .filter((file) => !file.endsWith(".js") && !file.endsWith(".json") && !file.startsWith("."));
        
        for (let dir of getDirs) {
            const dirPath = path.join(srcPath, dir);
            if (existsSync(dirPath)) {
                const files = readdirSync(dirPath).filter((file) => file.endsWith(".js") && file !== 'main.js');
                for (let file of files) {
                    if (loadRoute(path.join(dirPath, file), dir)) n++;
                }
                
                // Load các file trong thư mục con của thư mục con
                const subDirs = readdirSync(dirPath)
                    .filter((file) => !file.endsWith(".js") && !file.endsWith(".json"));
                
                for (let subDir of subDirs) {
                    const subDirPath = path.join(dirPath, subDir);
                    if (existsSync(subDirPath)) {
                        const subFiles = readdirSync(subDirPath).filter((file) => file.endsWith(".js"));
                        for (let subFile of subFiles) {
                            if (loadRoute(path.join(subDirPath, subFile), dir)) n++;
                        }
                    }
                }
            }
        }

        // Load .hidden routes separately
        const hiddenPath = path.join(srcPath, '.hidden');
        if (existsSync(hiddenPath)) {
            const hiddenFiles = readdirSync(hiddenPath).filter((file) => file.endsWith(".js"));
            for (let file of hiddenFiles) {
                if (loadRoute(path.join(hiddenPath, file), 'Hidden')) n++;
            }
        }

        log(`Successfully loaded ${n} route files`, 'API');
        log(`Total routes by category:`, 'INFO');
        Object.entries(loadedRoutes).forEach(([category, routes]) => {
            log(`  • ${category}: ${routes.length} routes`, 'INFO');
        });
    } catch (e) {
        log(`Error reading lib directory: ${e.message}`, 'ERROR');
    }
}

// Setup file watcher for auto-reload
function setupAutoReload() {
    const libPath = path.join(process.cwd(), "/Main/lib/");
    const hiddenPath = path.join(process.cwd(), "/Main/lib/.hidden/");
    
    // Watch for changes in lib directory
    const watcher = chokidar.watch([libPath + '**/*.js', hiddenPath + 'config.json'], {
        ignored: /node_modules/,
        persistent: true,
        ignoreInitial: true
    });

    watcher.on('change', (filePath) => {
        log(`File changed: ${filePath}`, 'WATCH');
        setTimeout(() => {
            loadAllRoutes(); // Reload all routes after file change
        }, 500); // Delay để đảm bảo file đã được ghi xong
    });

    watcher.on('add', (filePath) => {
        if (filePath.endsWith('.js')) {
            log(`New file added: ${filePath}`, 'WATCH');
            setTimeout(() => {
                loadAllRoutes();
            }, 500);
        }
    });

    watcher.on('unlink', (filePath) => {
        if (filePath.endsWith('.js')) {
            log(`File deleted: ${filePath}`, 'WATCH');
            setTimeout(() => {
                loadAllRoutes();
            }, 500);
        }
    });

    log('Auto-reload watcher initialized', 'WATCH');
}

// Initial load
loadAllRoutes();

// Setup auto-reload if not in production
if (process.env.NODE_ENV !== 'production') {
    setupAutoReload();
}

module.exports = { router, loadedRoutes };