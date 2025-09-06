import express, { type Request, type Response, type NextFunction } from "express";
import http from "http";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, log } from "./vite"; // Removed serveStatic as we handle it manually now

const app = express();
// NOTE: We don't create the server with http.createServer here because Vercel handles it.
// We export the `app` directly for Vercel to use.

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- Main Application Logic ---

// --- Define Your API Routes FIRST ---
app.get("/api/hello", (req, res) => {
    res.send("Hello World");
});

// Assuming registerRoutes adds more API routes to the 'app'
registerRoutes(app); 

// --- Vite and Static File Setup ---
if (process.env.NODE_ENV === "development") {
    // In development, we need to set up Vite, but this part won't run on Vercel.
    (async () => {
        const server = http.createServer(app);
        await setupVite(app, server);
        const port = parseInt(process.env.PORT || '5000', 10);
        server.listen(port, "0.0.0.0", () => {
            log(`Server is running for development on http://localhost:${port}`);
        });
    })();
} else {
    // --- THIS IS THE PRODUCTION CODE FOR VERCEL ---
    // 1. Define the path to your built frontend files.
    // Vercel builds the project into the root 'dist' folder.
    const buildPath = path.resolve(__dirname, '..', 'dist');
    
    // 2. Tell Express to serve static files (like JS, CSS) from that folder.
    app.use(express.static(buildPath));

    // 3. For any other request that is NOT an API route, send the index.html file.
    // This is the key for Single-Page Applications (SPAs) to work.
    app.get('*', (req, res) => {
        res.sendFile(path.join(buildPath, 'index.html'));
    });
}

// --- Error Handling Middleware ---
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error(err); // Log the full error to the console
    res.status(status).json({ message });
});


// Export the app for Vercel to use as a serverless function
export default app;

