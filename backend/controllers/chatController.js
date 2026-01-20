const ChatSession = require('../models/ChatSession');
const legalService = require('../services/legalService');
// const { findIPC } = require('../services/ipcService'); // Deprecated in favor of legalService // Fallback service
const axios = require('axios');
const OpenAI = require('openai');

// Safe initialization of OpenAI
let openai;
try {
    const apiKey = process.env.THINKSTACK_API_KEY || process.env.OPENAI_API_KEY;
    if (apiKey) {
        openai = new OpenAI({ apiKey });
    } else {
        console.warn("OpenAI API Key missing. Using fallback/simulation mode.");
    }
} catch (err) {
    console.warn("OpenAI initialization failed:", err.message);
}

// Helper function to get answer from Python ML Service
const getMLAnswer = async (question) => {
    try {
        const response = await axios.post('http://localhost:5001/api/get-answer', { question });
        if (response.data && response.data.status === 'success') {
            return { answer: response.data.answer, confidence: response.data.confidence };
        }
        return null;
    } catch (error) {
        return null;
    }
};

// Helper function to get answer from OpenAI (ChatGPT)
const getOpenAIAnswer = async (question) => {
    if (!openai) return null;
    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "You are LawAI, a helpful and intelligent legal assistant for Indian Law. You provide accurate, concise, and professional answers. If the user asks a general question, answer politely. If it's a legal question, provide broad context." },
                { role: "user", content: question }
            ],
            model: "gpt-3.5-turbo",
        });
        return completion.choices[0].message.content;
    } catch (error) {
        console.error("OpenAI API Error:", error.message);
        return null;
    }
};

// Simulated AI Response (Offline Mode)
const getSimulatedAnswer = async (query) => {
    // Basic keyword matching for demo/offline purposes
    const lowerQuery = query.toLowerCase();

    // Check IPC Service first
    // Check Legal Service (IPC, CrPC, etc.)
    try {
        const legalResults = await legalService.searchLegalData(query);
        if (legalResults && legalResults.length > 0) {
            const topResult = legalResults[0];
            let response = `**Found in ${topResult.source}:**\n\n**Section ${topResult.section}**: ${topResult.title}\n\n*Description*: ${topResult.description}`;

            if (topResult.example) {
                response += `\n\n**Example**: ${topResult.example}`;
            }

            return response;
        }
    } catch (e) { console.error("Legal Search Error:", e); }

    if (lowerQuery.includes('hello') || lowerQuery.includes('hi')) return "Hello! I am Lawyer.AI. How can I assist you with your legal queries today?";
    if (lowerQuery.includes('draft')) return "I can help you draft legal documents. Please specify the type of agreement (e.g., Rent Agreement, NDA).";
    if (lowerQuery.includes('divorce')) return "Divorce laws in India vary by religion. For detailed advice, consulting a Family Lawyer is recommended. Generally, mutual consent divorce takes 6-18 months.";
    if (lowerQuery.includes('property')) return "Property disputes are governed by the Transfer of Property Act. Key documents include the Title Deed and Mother Deed.";
    if (lowerQuery.includes('agreement')) return "A valid agreement requires offer, acceptance, and consideration. I can help outline the key clauses for you.";

    return "I searched my legal database (covering IPC, CrPC, CPC, RTI, etc.) but couldn't find a specific reference for that. Please try asking about a specific Section (e.g., 'IPC 420') or use legal keywords.";
};

const sendMessage = async (req, res) => {
    try {
        const { message, sessionId } = req.body;
        const userId = req.user.id;

        if (!message) {
            return res.status(400).json({ status: 'error', message: 'Message is required' });
        }

        let session;
        if (sessionId) {
            session = await ChatSession.findOne({ _id: sessionId, userId });
        }

        // If no session exists or ID not found, create one
        if (!session) {
            session = new ChatSession({ userId, messages: [] });
        }

        // Update Title if it's the first message
        if (session.messages.length === 0) {
            session.title = message.length > 30 ? message.substring(0, 30) + '...' : message;
        }

        // Save User Message
        session.messages.push({ role: 'user', content: message });

        let botResponse = null;
        let source = 'none';

        // 1. Try Local ML 
        const mlResult = await getMLAnswer(message);
        if (mlResult) {
            botResponse = mlResult.answer;
            source = 'ml';
        }

        // 2. Try OpenAI
        if (!botResponse) {
            const aiResponse = await getOpenAIAnswer(message);
            if (aiResponse) {
                botResponse = aiResponse;
                source = 'openai';
            }
        }

        // 3. Fallback / Simulation
        if (!botResponse) {
            console.log("Using Simulation/Fallback AI");
            botResponse = await getSimulatedAnswer(message);
            source = 'simulated';
        }

        // Save Bot Message
        session.messages.push({ role: 'bot', content: botResponse });
        await session.save();

        res.status(200).json({
            status: 'success',
            data: {
                response: botResponse,
                sessionId: session._id,
                title: session.title,
                source
            }
        });

    } catch (error) {
        console.error("Chat Error:", error);
        // RETURN A FRIENDLY ERROR INSTEAD OF 500
        res.status(200).json({
            status: 'success',
            data: {
                response: "I'm having trouble connecting to my knowledge base right now. Please try again in a moment.",
                sessionId: req.body.sessionId // Return ID if possible to keep chat alive
            }
        });
    }
};

const createSession = async (req, res) => {
    try {
        const session = new ChatSession({
            userId: req.user.id,
            messages: []
        });
        await session.save();
        res.status(201).json({ status: 'success', data: session });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to create session' });
    }
};

const getSessions = async (req, res) => {
    try {
        const sessions = await ChatSession.find({ userId: req.user.id }).sort({ lastUpdated: -1 });
        res.status(200).json({ status: 'success', data: sessions });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch sessions' });
    }
};

const getSession = async (req, res) => {
    try {
        const session = await ChatSession.findOne({ _id: req.params.sessionId, userId: req.user.id });
        if (!session) return res.status(404).json({ status: 'error', message: 'Session not found' });
        res.status(200).json({ status: 'success', data: session });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to load session' });
    }
};

const deleteSession = async (req, res) => {
    try {
        await ChatSession.findOneAndDelete({ _id: req.params.sessionId, userId: req.user.id });
        res.status(200).json({ status: 'success', message: 'Session deleted' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to delete session' });
    }
};

module.exports = { createSession, getSessions, getSession, deleteSession, sendMessage };
