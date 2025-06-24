// src/middleware/errorMiddleware.ts
import { Request, Response, NextFunction } from 'express';

// Middleware for handling 404 Not Found errors
const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error); // Pass the error to the next middleware (which will be our error handler)
};

// Custom error handling middleware
const errorHandler = (
  err: any, // You can refine this 'any' type if you have a custom Error class
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Determine the status code: if it's still 200 (meaning no error status was explicitly set),
  // then it's an internal server error (500). Otherwise, use the existing status.
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // If headers have already been sent, delegate to default Express error handling
  // This prevents trying to send a response after one has already been sent
  if (res.headersSent) {
    return next(err);
  }

  // Handle specific Mongoose/MongoDB CastError (e.g., invalid ObjectId)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // --- Prisma Error Handling ---
    // Prisma errors often have a 'code' property, e.g., 'P2002' for unique constraint violation.
    // You'll need to import PrismaClient or ensure `err` is an instance of a Prisma error.
    // For demonstration, let's assume `err` might have a `code` property from Prisma.

    switch (err.code) {
        case 'P2002': // Unique constraint violation
            statusCode = 409; // Conflict
            message = `Duplicate field value: ${err.meta.target.join(', ')}.`;
            break;
        case 'P2025': // Record not found (e.g., when updating/deleting non-existent record)
            statusCode = 404; // Not Found
            message = 'Resource not found.';
            break;
        case 'P2003': // Foreign key constraint failed
            statusCode = 400; // Bad Request
            message = 'Invalid input: Foreign key constraint failed.';
            break;
        case 'P2000': // Value too long for column type, invalid enum value, etc.
            statusCode = 400; // Bad Request
            message = 'Invalid input provided.';
            break;
        case 'P1001': // Can't reach database server
            statusCode = 503; // Service Unavailable
            message = 'Database service is temporarily unavailable.';
            break;
        // Add more Prisma error codes as needed based on your application's requirements
        // You can find a full list of Prisma client error codes here:
        // https://www.prisma.io/docs/reference/api-reference/error-reference#client-errors
        default:
            // If it's a generic PrismaClientKnownRequestError, but not one we've specifically handled
            if (err.name === 'PrismaClientKnownRequestError') {
                statusCode = 400; // Generic bad request for unhandled Prisma errors
                message = `Database operation failed: ${err.message.split('\n')[0]}`;
            } else if (err.name === 'PrismaClientValidationError') {
                // Occurs when invalid arguments are provided to Prisma client methods
                statusCode = 400;
                message = `Invalid database query: ${err.message.split('\n')[0]}`;
            } else if (err.name === 'PrismaClientInitializationError') {
                 // Occurs when Prisma Client fails to initialize
                statusCode = 500;
                message = `Database initialization error: ${err.message.split('\n')[0]}`;
            }
            break;
    }

  // Send the error response
  res.status(statusCode).json({
    message: message,
    // Only send the stack trace in development environment for debugging
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

export { notFound, errorHandler };