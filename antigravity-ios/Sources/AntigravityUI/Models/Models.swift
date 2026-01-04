import Foundation

// --- 1. CORE MODELS (Shared by all views) ---

struct Project: Codable, Identifiable, Sendable {
    let id: String
    let name: String
    let status: String
    let description: String
    let resonance: Int
    
    // Compatibility for legacy ListFlows.swift
    var resonanceScore: Int { resonance }
    var lastUpdate: Date { Date() }
}

struct AuthRequest: Codable, Identifiable, Sendable {
    let id: String
    let type: String
    let title: String
    let description: String?
    
    // Compatibility for legacy ListFlows.swift
    var projectName: String { title }
    var requestDescription: String { description ?? "" }
    var priority: Int { 5 }
}

struct PollingResponse: Codable, Sendable {
    let hasPending: Bool
    let request: AuthRequest?
}

// --- 2. LEGACY SUPPORT (For ListFlows.swift) ---

enum ProjectStatus: String, Codable, Sendable {
    case active = "ACTIVE"
    case pending = "PENDING"
    case archived = "ARCHIVED"
}

typealias ApprovalRequest = AuthRequest

// --- 3. THEME ---

import SwiftUI

struct AntigravityTheme {
    static let accent = Color(red: 0, green: 0.9, blue: 1.0) // Neon Cyan
    static let background = Color.black
    static let glass = Color.white.opacity(0.05)
    static let secondaryGlass = Color.white.opacity(0.1)
}

struct MockData {
    static let projects: [Project] = []
    static let requests: [ApprovalRequest] = []
}
