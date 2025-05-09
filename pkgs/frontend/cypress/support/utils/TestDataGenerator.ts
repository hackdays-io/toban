/// <reference types="cypress" />

/**
 * Utility functions for generating test data
 */

/**
 * Generate a random workspace name with current date
 * @returns Random workspace name
 */
export function generateWorkspaceName(): string {
  const date = new Date();
  const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return `テスト用ワークスペース ${formattedDate} ${Math.floor(Math.random() * 10000)}`;
}

/**
 * Generate a random workspace description
 * @returns Random workspace description
 */
export function generateWorkspaceDescription(): string {
  const date = new Date();
  const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return `これはテスト用のワークスペース説明です。作成日: ${formattedDate}`;
}

/**
 * Get path to sample image for testing
 * @returns Path to sample image
 */
export function getSampleImagePath(): string {
  return "images/workspace_sample.png";
}
