
const fs = require('fs');
const path = require('path');

module.exports.name = "/admin/hidden";
module.exports.index = async (req, res) => {
    try {
        const { admin, action, route } = req.query;
        
        if (admin !== "true") {
            return res.status(401).json({
                status: false,
                message: "Unauthorized access"
            });
        }

        const configPath = path.join(__dirname, 'config.json');
        let config = {};

        // Load current config
        try {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch (e) {
            config = { hiddenRoutes: [] };
        }

        switch (action) {
            case 'list':
                return res.json({
                    status: true,
                    hiddenRoutes: config.hiddenRoutes || [],
                    total: (config.hiddenRoutes || []).length
                });

            case 'add':
                if (!route) {
                    return res.status(400).json({
                        status: false,
                        message: "Route parameter required"
                    });
                }
                
                if (!config.hiddenRoutes) config.hiddenRoutes = [];
                if (!config.hiddenRoutes.includes(route)) {
                    config.hiddenRoutes.push(route);
                    config.lastUpdated = new Date().toISOString();
                    fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
                    
                    return res.json({
                        status: true,
                        message: `Route ${route} added to hidden list`,
                        hiddenRoutes: config.hiddenRoutes
                    });
                } else {
                    return res.json({
                        status: false,
                        message: "Route already in hidden list"
                    });
                }

            case 'remove':
                if (!route) {
                    return res.status(400).json({
                        status: false,
                        message: "Route parameter required"
                    });
                }
                
                if (config.hiddenRoutes && config.hiddenRoutes.includes(route)) {
                    config.hiddenRoutes = config.hiddenRoutes.filter(r => r !== route);
                    config.lastUpdated = new Date().toISOString();
                    fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
                    
                    return res.json({
                        status: true,
                        message: `Route ${route} removed from hidden list`,
                        hiddenRoutes: config.hiddenRoutes
                    });
                } else {
                    return res.json({
                        status: false,
                        message: "Route not found in hidden list"
                    });
                }

            default:
                return res.json({
                    status: true,
                    message: "Hidden routes management",
                    actions: {
                        list: "/admin/hidden?admin=true&action=list",
                        add: "/admin/hidden?admin=true&action=add&route=/your/route",
                        remove: "/admin/hidden?admin=true&action=remove&route=/your/route"
                    }
                });
        }
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Internal server error",
            error: error.message
        });
    }
};
