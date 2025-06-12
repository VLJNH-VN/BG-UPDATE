
module.exports.name = "/internal/debug";
module.exports.index = async (req, res) => {
    const { key, info } = req.query;
    
    // Simple security check
    if (key !== "debug123") {
        return res.status(403).json({
            status: false,
            message: "Access denied"
        });
    }

    const debugInfo = {
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        timestamp: new Date().toISOString()
    };

    if (info === 'env') {
        debugInfo.env = process.env;
    }

    return res.json({
        status: true,
        debug: debugInfo
    });
};
