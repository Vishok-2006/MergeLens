import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { 
  activeAnalyses, 
  runAnalysisTask, 
  processChatWithRepository 
} from "./server/analysisService";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON parse middleware
app.use(express.json());

// Consistent JSON Response Helper
function sendSuccess(res: express.Response, message: string, data: any = null) {
  return res.json({
    status: "success",
    message,
    data,
    errors: null,
    timestamp: new Date().toISOString()
  });
}

function sendError(res: express.Response, message: string, errors: any = null, status = 400) {
  return res.status(status).json({
    status: "error",
    message,
    data: null,
    errors,
    timestamp: new Date().toISOString()
  });
}

// Global System Health endpoints
app.get("/health", (req, res) => {
  sendSuccess(res, "MergeLens API is online and fully functional.");
});
app.get("/api/health", (req, res) => {
  sendSuccess(res, "MergeLens API is online and fully functional.");
});

// Normalize Repository inputs (owner/repo or complete github.com urls)
function normalizeRepoUrl(input: string): string {
  let clean = input.trim();
  // Strip trailing slashes or .git suffix
  clean = clean.replace(/\/+$/, "").replace(/\.git$/, "");
  
  // Extract owner/repo from URL
  if (clean.includes("github.com/")) {
    const parts = clean.split("github.com/");
    if (parts.length > 1) {
      clean = parts[1];
    }
  }
  
  // Clean up any double slashes or unwanted spaces
  const segments = clean.split("/").map(s => s.trim()).filter(Boolean);
  if (segments.length >= 2) {
    return `${segments[0]}/${segments[1]}`;
  }
  
  return clean;
}

// POST: Trigger new repository analysis
const analyzeHandler = async (req: express.Request, res: express.Response) => {
  const { repoUrl } = req.body;
  if (!repoUrl || typeof repoUrl !== "string") {
    return sendError(res, "Validation Error: Repository input is required.", ["repoUrl is missing or invalid"]);
  }

  const normalized = normalizeRepoUrl(repoUrl);
  // Match standard owner/repository structure
  const repoRegex = /^[a-zA-Z0-9-._]+\/[a-zA-Z0-9-._]+$/;
  if (!repoRegex.test(normalized)) {
    return sendError(res, "Validation Error: Invalid GitHub repository format. Must be 'owner/repository' or a github.com link.", [
      "Expected format: 'facebook/react' or 'https://github.com/facebook/react'"
    ]);
  }

  const analysisId = `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  
  // Initialize state in-memory
  activeAnalyses.set(analysisId, {
    id: analysisId,
    repoUrl: normalized,
    status: "idle",
    progress: 0,
    message: "Initializing analysis workspace..."
  });

  // Launch background worker task asynchronously without awaiting
  runAnalysisTask(analysisId, normalized);

  return sendSuccess(res, "Repository analysis successfully initiated.", { id: analysisId, target: normalized });
};

app.post("/analyze", analyzeHandler);
app.post("/api/analyze", analyzeHandler);

// GET: Retrieve progress or completed analysis
const getAnalysisHandler = (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const state = activeAnalyses.get(id);
  
  if (!state) {
    return sendError(res, "Resource Error: Analysis session ID not found.", [`No record found matching: ${id}`], 404);
  }

  return sendSuccess(res, "Analysis data retrieved successfully.", state);
};

app.get("/analysis/:id", getAnalysisHandler);
app.get("/api/analysis/:id", getAnalysisHandler);

// GET: Retrieve raw reports
const getReportsHandler = (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const state = activeAnalyses.get(id);
  
  if (!state) {
    return sendError(res, "Resource Error: Report session ID not found.", [`No record found matching: ${id}`], 404);
  }
  
  if (state.status !== "completed" || !state.report) {
    return sendError(res, "Analysis Report is not yet ready or failed processing.", [
      `Current state: ${state.status}`
    ]);
  }

  return sendSuccess(res, "Full engineering report retrieved successfully.", state.report);
};

app.get("/reports/:id", getReportsHandler);
app.get("/api/reports/:id", getReportsHandler);

// POST: Repository-aware AI chat conversation
const chatHandler = async (req: express.Request, res: express.Response) => {
  const { analysisId, history } = req.body;
  
  if (!analysisId || !Array.isArray(history)) {
    return sendError(res, "Validation Error: 'analysisId' and 'history' array are required in request body.");
  }

  const state = activeAnalyses.get(analysisId);
  if (!state) {
    return sendError(res, "Resource Error: Analysis session not found.", [`Session ${analysisId} not found.`]);
  }

  if (state.status !== "completed" || !state.report) {
    return sendError(res, "AI Chat is inactive until repository analysis is fully complete.");
  }

  try {
    const aiResponse = await processChatWithRepository(state.report, history);
    return sendSuccess(res, "Response generated successfully.", { response: aiResponse });
  } catch (error: any) {
    return sendError(res, "AI Processing failed during Chat query generation.", [error?.message]);
  }
};

app.post("/chat", chatHandler);
app.post("/api/chat", chatHandler);

// Start Server Setup with Vite integration for static / dev assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Mount Vite dev server
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MergeLens Server launched successfully on http://localhost:${PORT}`);
  });
}

startServer();
