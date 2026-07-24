export function notFound(req, res) {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} was not found.` });
}

export function errorHandler(error, _req, res, _next) {
  console.error(error);
  const status = error.status || 500;
  res.status(status).json({ message: error.message || "Something went wrong." });
}

export function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

export function notFoundError(message) {
  const error = new Error(message);
  error.status = 404;
  return error;
}

export function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}
