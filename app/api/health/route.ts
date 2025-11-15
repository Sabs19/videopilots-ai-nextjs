import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * Health check endpoint for monitoring and load balancers
 * Returns 200 if the application and database are healthy
 * Used by Coolify, Kubernetes, and other orchestration tools
 */
export async function GET() {
  const startTime = Date.now();
  const health: {
    status: "healthy" | "unhealthy";
    timestamp: string;
    uptime: number;
    database: "connected" | "disconnected" | "error";
    responseTime: number;
    version?: string;
  } = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: "disconnected",
    responseTime: 0,
    version: process.env.npm_package_version || "unknown",
  };

  try {
    // Test database connection with timeout
    const dbStartTime = Date.now();
    await Promise.race([
      pool.query("SELECT 1"),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Database connection timeout")), 5000)
      ),
    ]);
    
    health.database = "connected";
    health.responseTime = Date.now() - dbStartTime;
    
    logger.debug("Health check passed", {
      databaseResponseTime: health.responseTime,
    });
  } catch (error) {
    health.status = "unhealthy";
    health.database = "error";
    health.responseTime = Date.now() - startTime;
    
    logger.error("Health check failed", error, {
      responseTime: health.responseTime,
    });
    
    return NextResponse.json(health, { 
      status: 503,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  }

  health.responseTime = Date.now() - startTime;

  return NextResponse.json(health, {
    status: health.status === "healthy" ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

