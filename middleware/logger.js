/**
 * Logger middleware for Express
 * Logs request information for debugging and monitoring
 */

const logger = (req, res, next) => {
  const start = Date.now();

  // Log when request is received
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  // Log request details
  if (process.env.NODE_ENV === "development") {
    console.log(`Request Body: ${JSON.stringify(req.body || {})}`);
    console.log(`Query Params: ${JSON.stringify(req.query || {})}`);
  }

  // Add response finish listener to log when request completes
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.url} ${
        res.statusCode
      } - ${duration}ms`
    );
  });

  next();
};

module.exports = logger;
