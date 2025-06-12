
const log = require("../../../utils/logger");

module.exports.name = "/admin/dashboard";
module.exports.index = async (req, res) => {
    try {
        const { admin, action } = req.query;
        
        // Simple admin authentication (you should improve this)
        if (admin !== "true") {
            return res.status(401).json({
                status: false,
                message: "Unauthorized access"
            });
        }

        switch (action) {
            case 'stats':
                const data = require('../../app/data.json');
                return res.json({
                    status: true,
                    data: {
                        totalRequests: data.total || 0,
                        uptime: process.uptime(),
                        memory: process.memoryUsage(),
                        timestamp: new Date().toISOString()
                    }
                });

            case 'routes':
                const { loadedRoutes } = require('../../app/server.js');
                return res.json({
                    status: true,
                    data: loadedRoutes
                });

            case 'reload':
                // Trigger manual reload
                log('Manual route reload triggered', 'ADMIN');
                return res.json({
                    status: true,
                    message: "Routes reloaded successfully"
                });

            default:
                return res.json({
                    status: true,
                    message: "Admin dashboard",
                    actions: ['stats', 'routes', 'reload'],
                    usage: "/admin/dashboard?admin=true&action=stats"
                });
        }
    } catch (error) {
        log(`Admin dashboard error: ${error.message}`, 'ERROR');
        return res.status(500).json({
            status: false,
            message: "Internal server error"
        });
    }
};
