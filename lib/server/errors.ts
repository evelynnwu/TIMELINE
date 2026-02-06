import { NextResponse } from "next/server";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
  }

  toResponse() {
    return NextResponse.json(
      {
        error: {
          code: this.code,
          message: this.message,
          details: this.details,
        },
      },
      { status: this.statusCode }
    );
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", details?: Record<string, unknown>) {
    super(404, "NOT_FOUND", message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required", details?: Record<string, unknown>) {
    super(401, "UNAUTHORIZED", message, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Permission denied", details?: Record<string, unknown>) {
    super(403, "FORBIDDEN", message, details);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Invalid request", details?: Record<string, unknown>) {
    super(400, "BAD_REQUEST", message, details);
  }
}

export class AIContentDetectedError extends AppError {
  constructor(details?: Record<string, unknown>) {
    super(
      400,
      "AI_CONTENT_DETECTED",
      "This content appears to be AI-generated and cannot be uploaded",
      details
    );
  }
}

export function handleError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return error.toResponse();
  }

  console.error("Unhandled error:", error);

  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    },
    { status: 500 }
  );
}
