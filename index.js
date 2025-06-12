const chalkAnimation = require('chalkercli');

// Define the text strings
const str = "BLACK-GOKU API Starting...";
const logo = `
╔══════════════════════════════════════╗
║            BLACK-GOKU API            ║
║         Powered by Node.js           ║
╚══════════════════════════════════════╝
`;

// Show animation once then start the app
const karaoke = chalkAnimation.karaoke(str);
setTimeout(() => {
    karaoke.stop();
    console.log(logo);
    console.log('🚀 Starting BLACK-GOKU API...\n');

    // Include the modified main application file
    require('./Main/app/main.js');

    // Start the bot after a short delay
    setTimeout(() => {
        require('./bot.js');
    }, 2000);
}, 2000);