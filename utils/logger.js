const chalk = require('chalk');

module.exports = (data, type) => {
    const colors = {
        'SUCCESS': chalk.green('✅'),
        'ERROR': chalk.red('❌'),
        'WARNING': chalk.yellow('⚠️'),
        'INFO': chalk.blue('ℹ️'),
        'CLEAN': chalk.cyan('🗑️')
    };
    
    const icon = colors[type.toUpperCase()] || chalk.gray('•');
    console.log(`${icon} ${data}`);
}

module.exports.banner = (data) => {
    const rdcl = ['blue', 'yellow', 'green', 'red', 'magenta', 'yellowBright', 'blueBright', 'magentaBright']
    const color = chalk[rdcl[Math.floor(Math.random() * rdcl.length)]]
    console.log(color(data));
}

// Thêm các method tiện ích
module.exports.success = (data) => {
    console.log(chalk.green('✅') + ' ' + data);
}

module.exports.error = (data) => {
    console.log(chalk.red('❌') + ' ' + data);
}

module.exports.warning = (data) => {
    console.log(chalk.yellow('⚠️') + ' ' + data);
}

module.exports.info = (data) => {
    console.log(chalk.blue('ℹ️') + ' ' + data);
}

// File logging
module.exports.logToFile = (data, type = 'INFO') => {
    try {
        const fs = require('fs');
        const path = require('path');
        
        const logDir = './logs';
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${type}] ${data}\n`;
        
        fs.appendFileSync(path.join(logDir, 'api.log'), logEntry);
    } catch (error) {
        console.error('Error writing to log file:', error.message);
    }
}

// Enhanced logging with file support
module.exports.enhanced = (data, type) => {
    // Console log
    module.exports(data, type);
    // File log
    module.exports.logToFile(data, type);
}