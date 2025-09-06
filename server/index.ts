import express, { type Request, type Response, type NextFunction } from "express";
import http from "http"; // It's good practice to import 'http' for creating the server
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// --- Create the app only ONCE ---
const app = express();
const server = http.createServer(app); // Create an HTTP server

// --- Middleware Setup ---
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Custom logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function(bodyJson: any) { // Removed extra args for simplicity and correctness
        capturedJsonResponse = bodyJson;
        return originalResJson.call(res, bodyJson);
    };

    res.on("finish", () => {
        const duration = Date.now() - start;
        if (path.startsWith("/api")) {
            let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
            if (capturedJsonResponse) {
                logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
            }

            if (logLine.length > 80) {
                logLine = logLine.slice(0, 79) + "…";
            }

            log(logLine);
        }
    });

    next();
});

// --- Main Application Logic in an async function ---
(async () => {
    // --- Define Your API Routes ---

    // This is the example route from your first code block
    app.get("/api/hello", (req, res) => {
        res.send("Hello World");
    });

    // Register other routes from your routes file
    await registerRoutes(server); // Pass the server instance if needed by registerRoutes

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        console.error(err); // Log the full error to the console
        res.status(status).json({ message });
    });

    // --- Vite and Static File Setup ---
    // Importantly, only setup Vite in development and after all other API routes
    if (process.env.NODE_ENV === "development") {
        await setupVite(app, server);
    } else {
        serveStatic(app);
    }

    // --- Start the Server ---
    const port = parseInt(process.env.PORT || '5000', 10);
    server.listen(port, "0.0.0.0", () => {
        log(`Server is running and listening on http://localhost:${port}`);
    });
})();
