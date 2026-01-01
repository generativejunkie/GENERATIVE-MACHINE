import SwiftUI

struct ProjectListView: View {
    let projects = MockData.projects
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("PROJECT ARCHIVE")
                    .font(.system(size: 14, weight: .bold, design: .monospaced))
                    .foregroundColor(AntigravityTheme.textSecondary)
                
                ForEach(projects) { project in
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text(project.name)
                                .font(.headline)
                                .foregroundColor(AntigravityTheme.accent)
                            Spacer()
                            StatusBadge(status: project.status)
                        }
                        
                        Text(project.description)
                            .font(.subheadline)
                            .foregroundColor(AntigravityTheme.textSecondary)
                        
                        HStack {
                            Label("\(project.resonanceScore)", systemImage: "bolt.fill")
                            Spacer()
                            Text("Updated: \(project.lastUpdate.formatted(date: .abbreviated, time: .omitted))")
                        }
                        .font(.caption2)
                        .foregroundColor(AntigravityTheme.accent.opacity(0.8))
                    }
                    .glassCardStyle()
                }
            }
            .padding()
        }
    }
}

struct StatusBadge: View {
    let status: ProjectStatus
    
    var color: Color {
        switch status {
        case .active: return .green
        case .pending: return .orange
        case .archived: return .gray
        }
    }
    
    var body: some View {
        Text(status.rawValue)
            .font(.system(size: 10, weight: .bold))
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(color.opacity(0.2))
            .foregroundColor(color)
            .cornerRadius(4)
            .overlay(
                RoundedRectangle(cornerRadius: 4)
                    .stroke(color.opacity(0.5), lineWidth: 1)
            )
    }
}

struct ApprovalListView: View {
    @State private var requests = MockData.requests
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("COMMAND APPROVALS")
                    .font(.system(size: 14, weight: .bold, design: .monospaced))
                    .foregroundColor(AntigravityTheme.textSecondary)
                
                if requests.isEmpty {
                    Text("NO PENDING REQUESTS")
                        .font(.caption)
                        .foregroundColor(AntigravityTheme.textSecondary)
                        .padding()
                }
                
                ForEach(requests) { request in
                    VStack(alignment: .leading, spacing: 15) {
                        HStack {
                            VStack(alignment: .leading) {
                                Text(request.projectName)
                                    .font(.caption)
                                    .foregroundColor(AntigravityTheme.accent)
                                Text(request.requestDescription)
                                    .font(.body)
                                    .bold()
                            }
                            Spacer()
                            PriorityIndicator(priority: request.priority)
                        }
                        
                        Divider().background(Color.white.opacity(0.1))
                        
                        HStack(spacing: 20) {
                            Button(action: { approve(request) }) {
                                Label("APPROVE", systemImage: "checkmark")
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 10)
                                    .background(Color.green.opacity(0.2))
                                    .foregroundColor(.green)
                                    .cornerRadius(8)
                            }
                            
                            Button(action: { deny(request) }) {
                                Label("DENY", systemImage: "xmark")
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 10)
                                    .background(Color.red.opacity(0.2))
                                    .foregroundColor(.red)
                                    .cornerRadius(8)
                            }
                        }
                    }
                    .glassCardStyle()
                }
            }
            .padding()
        }
    }
    
    func approve(_ request: ApprovalRequest) {
        // Handle approval
        withAnimation {
            requests.removeAll { $0.id == request.id }
        }
    }
    
    func deny(_ request: ApprovalRequest) {
        // Handle denial
        withAnimation {
            requests.removeAll { $0.id == request.id }
        }
    }
}

struct PriorityIndicator: View {
    let priority: Int
    
    var body: some View {
        HStack(spacing: 3) {
            ForEach(0..<10) { i in
                Rectangle()
                    .fill(i < priority ? AntigravityTheme.accent : Color.white.opacity(0.1))
                    .frame(width: 3, height: 12)
            }
        }
    }
}
