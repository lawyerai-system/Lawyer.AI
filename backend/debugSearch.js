const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const IPC = require('./models/IPC');

dotenv.config({ path: path.join(__dirname, '.env') });

const debugSearch = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("MongoDB Connected for Debugging");

        const queries = ["320", "IPC 320", "Grievous hurt"]; // 320 is typically "Grievous hurt"

        for (const q of queries) {
            console.log(`\n--- Searching for: "${q}" ---`);

            // Replicating ipcService.js logic
            const sectionResults = await IPC.find({
                section: { $regex: q, $options: 'i' }
            });
            console.log(`Section Matches: ${sectionResults.length}`);
            if (sectionResults.length > 0) console.log("Sample Section:", sectionResults[0].section);

            const keywordResults = await IPC.find({
                $or: [
                    { description: { $regex: q, $options: 'i' } },
                    { offence: { $regex: q, $options: 'i' } }
                ]
            });
            console.log(`Keyword Matches: ${keywordResults.length}`);
        }

        // Dump specifically Section 320 if it exists
        console.log("\n--- Direct Lookup for 320 ---");
        const specific = await IPC.findOne({ section: { $regex: '320', $options: 'i' } });
        if (specific) {
            console.log("Found Document containing 320 in section:");
            console.log(JSON.stringify(specific, null, 2));
        } else {
            console.log("No document found with 320 in section field.");
        }

        process.exit();
    } catch (error) {
        console.error("Debug Error:", error);
        process.exit(1);
    }
};

debugSearch();
