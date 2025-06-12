
exports.name = '/health';
exports.index = async (req, res, next) => {
    try {
        const uptime = process.uptime();
        const memUsage = process.memoryUsage();
        const { loadedRoutes } = require('../../app/server.js');
        
        const healthData = {
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: {
                seconds: Math.floor(uptime),
                human: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`
            },
            memory: {
                used: Math.round(memUsage.used / 1024 / 1024),
                total: Math.round(memUsage.heapTotal / 1024 / 1024),
                unit: 'MB'
            },
            routes: {
                total: Object.values(loadedRoutes).flat().length,
                categories: Object.keys(loadedRoutes).length
            },
            environment: {
                node_version: process.version,
                platform: process.platform,
                pid: process.pid
            }
        };

        res.json({
            success: true,
            data: healthData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Health check failed',
            message: error.message
        });
    }
};
