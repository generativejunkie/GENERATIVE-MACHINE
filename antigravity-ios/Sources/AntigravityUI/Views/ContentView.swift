import SwiftUI
import Combine

// --- MODELS ---
// (Already defined in Models.swift, assuming connectivity)

// --- COMMAND LOGIC ---

class AntigravityCommandCenter: ObservableObject {
    @Published var lastResponse: String = "READY"
    @Published var isProcessing: Bool = false
    @Published var pendingRequest: AuthRequest? = nil
    @Published var projects: [Project] = []
    @Published var terminalLog: [String] = []
    
    // MacOS IP
    private let targetServerHost = "192.168.11.41"
    private let targetPort = "8000"
    
    init() {
        startPolling()
        fetchHistory()
    }
    
    func startPolling() {
        Timer.scheduledTimer(withTimeInterval: 2.0, repeats: true) { _ in
            self.checkForRequests()
            self.fetchProjects()
            self.fetchHistory()
        }
    }
    
    func fetchProjects() {
        let urlString = "http://\(targetServerHost):\(targetPort)/api/projects"
        guard let url = URL(string: urlString) else { return }
        URLSession.shared.dataTask(with: url) { data, _, _ in
            guard let data = data else { return }
            if let fetched = try? JSONDecoder().decode([Project].self, from: data) {
                DispatchQueue.main.async { self.projects = fetched }
            }
        }.resume()
    }
    
    func fetchHistory() {
        let urlString = "http://\(targetServerHost):\(targetPort)/api/instructions"
        guard let url = URL(string: urlString) else { return }
        URLSession.shared.dataTask(with: url) { data, _, _ in
            guard let data = data else { return }
            struct HistoryItem: Codable { let timestamp: String; let text: String }
            if let history = try? JSONDecoder().decode([HistoryItem].self, from: data) {
                DispatchQueue.main.async {
                    self.terminalLog = history.map { "\($0.text)" }
                }
            }
        }.resume()
    }
    
    func checkForRequests() {
        let urlString = "http://\(targetServerHost):\(targetPort)/api/pending-auth"
        guard let url = URL(string: urlString) else { return }
        URLSession.shared.dataTask(with: url) { data, _, _ in
            guard let data = data else { return }
            if let response = try? JSONDecoder().decode(PollingResponse.self, from: data) {
                DispatchQueue.main.async {
                    if response.hasPending {
                        if self.pendingRequest?.id != response.request?.id {
                            self.pendingRequest = response.request
                            UINotificationFeedbackGenerator().notificationOccurred(.warning)
                        }
                    } else { self.pendingRequest = nil }
                }
            }
        }.resume()
    }
    
    func toggleProject(_ projectId: String) {
        let urlString = "http://\(targetServerHost):\(targetPort)/api/projects/action"
        guard let url = URL(string: urlString) else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let body: [String: String] = ["projectId": projectId, "action": "TOGGLE"]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { _, _, _ in
            DispatchQueue.main.async { self.fetchProjects() }
        }.resume()
    }
    
    func respondToAuth(approved: Bool) {
        let urlString = "http://\(targetServerHost):\(targetPort)/api/respond-auth"
        guard let url = URL(string: urlString) else { return }
        guard let requestId = pendingRequest?.id else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let body: [String: Any] = ["approved": approved, "requestId": requestId]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { _, _, _ in
            DispatchQueue.main.async { self.pendingRequest = nil }
        }.resume()
    }
    
    func sendInstruction(_ text: String) {
        sendCommand(type: "instruction", detail: ["text": text]) // 'instruction' type triggers persistence on bridge
    }
    
    func sendCommand(type: String, detail: [String: String]? = nil) {
        let urlString = "http://\(targetServerHost):\(targetPort)/api/command"
        guard let url = URL(string: urlString) else { return }
        
        self.isProcessing = true
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = ["type": type, "detail": detail ?? [:]]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { _, response, _ in
            DispatchQueue.main.async {
                self.isProcessing = false
                if let res = response as? HTTPURLResponse {
                    self.lastResponse = res.statusCode == 200 ? "OK" : "ERR"
                }
            }
        }.resume()
    }
}

// --- UI COMPONENTS ---

struct ProjectRow: View {
    let project: Project
    let onAction: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(project.name)
                        .font(.system(.headline, design: .monospaced))
                        .foregroundColor(.white)
                    Text(project.status)
                        .font(.system(size: 10, weight: .bold, design: .monospaced))
                        .foregroundColor(statusColor)
                }
                Spacer()
                
                // Resonance Meter
                VStack(alignment: .trailing, spacing: 4) {
                    Text("RESONANCE").font(.system(size: 8)).foregroundColor(.gray)
                    Text("\(project.resonance)%").font(.system(.body, design: .monospaced)).foregroundColor(AntigravityTheme.accent)
                }
            }
            
            Text(project.description)
                .font(.caption)
                .foregroundColor(.gray)
            
            // Progress Bar simulation
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Rectangle().fill(Color.white.opacity(0.1)).frame(height: 2)
                    Rectangle().fill(statusColor).frame(width: geo.size.width * CGFloat(project.resonance) / 100.0, height: 2)
                }
            }.frame(height: 2)
            
            Button(action: {
                UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                onAction()
            }) {
                HStack {
                    Spacer()
                    Text(actionButtonText)
                        .font(.system(size: 12, weight: .bold, design: .monospaced))
                    Spacer()
                }
                .padding(.vertical, 10)
                .background(project.status == "PENDING" ? Color.yellow : statusColor.opacity(0.2))
                .foregroundColor(project.status == "PENDING" ? .black : statusColor)
                .cornerRadius(8)
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(project.status == "PENDING" ? Color.yellow : statusColor.opacity(0.5), lineWidth: 1))
            }
        }
        .padding(20)
        .background(AntigravityTheme.glass)
        .cornerRadius(16)
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.1), lineWidth: 1))
    }
    
    var statusColor: Color {
        switch project.status {
        case "ACTIVE": return .green
        case "PENDING": return .yellow
        case "STANDBY": return .gray
        default: return .blue
        }
    }
    
    var actionButtonText: String {
        switch project.status {
        case "ACTIVE": return "[ STANDBY ]"
        case "PENDING": return "⚠ APPROVE SYSTEM ⚠"
        case "STANDBY": return "[ ACTIVATE ]"
        default: return "[ EXECUTE ]"
        }
    }
}

// --- MAIN VIEW ---

struct ContentView: View {
    @StateObject private var commandCenter = AntigravityCommandCenter()
    @State private var instructionText: String = ""
    @State private var selectedTab: Int = 0
    
    init() {
        UITabBar.appearance().unselectedItemTintColor = UIColor.gray
        let appearance = UITabBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = UIColor.black
        UITabBar.appearance().standardAppearance = appearance
        UITabBar.appearance().scrollEdgeAppearance = appearance
    }
    
    var body: some View {
        ZStack {
            AntigravityTheme.background.ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Shared Header
                HStack {
                    VStack(alignment: .leading) {
                        Text("HYPER_SYNC // \(selectedTab == 0 ? "COMMAND" : "NODES")").font(.system(size: 10, design: .monospaced)).foregroundColor(AntigravityTheme.accent)
                        Text(selectedTab == 0 ? "ORCHESTRATOR COMMAND" : "PROJECT_DASHBOARD").font(.title3).bold().foregroundColor(.white)
                    }
                    Spacer()
                    StatusPill(text: commandCenter.lastResponse)
                }.padding(.horizontal, 24).padding(.top, 20).padding(.bottom, 15)
                
                TabView(selection: $selectedTab) {
                    // TAB 1: COMMAND
                    VStack(spacing: 0) {
                        ScrollView {
                            VStack(spacing: 25) {
                                // CHAT / INSTRUCTION LOG
                                VStack(alignment: .leading, spacing: 10) {
                                    Text("COMMUNICATION_RELAY").font(.system(size: 10, design: .monospaced)).foregroundColor(.gray)
                                    VStack(alignment: .leading, spacing: 6) {
                                        if commandCenter.terminalLog.isEmpty {
                                            Text("Awaiting neural link...").italic().font(.caption).foregroundColor(.gray)
                                        }
                                        ForEach(commandCenter.terminalLog, id: \.self) { line in
                                            Text("> \(line)").font(.system(size: 11, design: .monospaced)).foregroundColor(.green)
                                        }
                                    }
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .padding(15)
                                    .background(Color.black.opacity(0.8))
                                    .cornerRadius(12)
                                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.green.opacity(0.3), lineWidth: 1))
                                }
                                
                                // DIRECT CONTROL GRID
                                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 15) {
                                    QuickButton(title: "VOID", icon: "eye.slash.fill", action: { commandCenter.sendCommand(type: "trigger-secret", detail: ["code": "void"]) })
                                    QuickButton(title: "NEXT", icon: "forward.fill", action: { commandCenter.sendCommand(type: "next-image") })
                                    QuickButton(title: "GLITCH", icon: "sparkles", action: { commandCenter.sendCommand(type: "glitch") })
                                    QuickButton(title: "SYNC", icon: "arrow.triangle.2.circlepath", action: { commandCenter.sendCommand(type: "sync-pulse") })
                                }
                            }
                            .padding(20)
                        }
                        
                        // STICKY INPUT AREA
                        VStack(spacing: 0) {
                            Divider().background(Color.white.opacity(0.1))
                            HStack(spacing: 12) {
                                TextField("Transmit to Singularity...", text: $instructionText)
                                    .padding(12)
                                    .background(Color.white.opacity(0.08))
                                    .cornerRadius(12)
                                    .foregroundColor(.white)
                                    .font(.system(size: 14, design: .monospaced))
                                    .submitLabel(.send)
                                    .onSubmit {
                                        if !instructionText.isEmpty {
                                            commandCenter.sendInstruction(instructionText)
                                            instructionText = ""
                                        }
                                    }
                                
                                Button(action: {
                                    if !instructionText.isEmpty {
                                        commandCenter.sendInstruction(instructionText)
                                        instructionText = ""
                                        hideKeyboard()
                                    }
                                }) {
                                    Image(systemName: "bolt.fill")
                                        .font(.system(size: 18, weight: .bold))
                                        .foregroundColor(.black)
                                        .frame(width: 44, height: 44)
                                        .background(AntigravityTheme.accent)
                                        .clipShape(Circle())
                                }
                            }
                            .padding(.horizontal, 20)
                            .padding(.vertical, 12)
                            .background(AntigravityTheme.background)
                        }
                    }
                    .tabItem { Label("COMMAND", systemImage: "terminal.fill") }.tag(0)
                    
                    // TAB 2: PROJECTS
                    VStack {
                        ScrollView {
                            VStack(spacing: 15) {
                                if commandCenter.projects.isEmpty {
                                    VStack(spacing: 20) {
                                        ProgressView().tint(AntigravityTheme.accent)
                                        Text("SCANNING FOR NODES...").font(.system(size: 10, design: .monospaced)).foregroundColor(.gray)
                                    }.padding(.top, 100)
                                }
                                
                                ForEach(commandCenter.projects) { project in
                                    ProjectRow(project: project) {
                                        commandCenter.toggleProject(project.id)
                                    }
                                }
                            }.padding(20)
                        }
                    }
                    .tabItem { Label("PROJECTS", systemImage: "square.grid.2x2.fill") }.tag(1)
                }
                .accentColor(AntigravityTheme.accent)
            }
            
            // GLOBAL AUTH OVERLAY
            if let request = commandCenter.pendingRequest {
                AuthRequestView(request: request, commandCenter: commandCenter).zIndex(100)
            }
        }
    }
    
    private func hideKeyboard() {
        UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
    }
}

struct QuickButton: View {
    let title: String
    let icon: String
    let action: () -> Void
    var body: some View {
        Button(action: { UIImpactFeedbackGenerator(style: .light).impactOccurred(); action() }) {
            HStack {
                Image(systemName: icon).font(.system(size: 14))
                Text(title).font(.system(size: 12, weight: .bold, design: .monospaced))
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 15)
            .background(AntigravityTheme.glass)
            .foregroundColor(.white)
            .cornerRadius(12)
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.1), lineWidth: 1))
        }
    }
}

struct StatusPill: View {
    let text: String
    var body: some View {
        Text(text)
            .font(.system(size: 8, weight: .bold, design: .monospaced))
            .padding(.vertical, 4)
            .padding(.horizontal, 8)
            .background(AntigravityTheme.accent.opacity(0.1))
            .foregroundColor(AntigravityTheme.accent)
            .cornerRadius(4)
            .overlay(RoundedRectangle(cornerRadius: 4).stroke(AntigravityTheme.accent.opacity(0.5), lineWidth: 1))
    }
}

struct AuthRequestView: View {
    let request: AuthRequest
    @ObservedObject var commandCenter: AntigravityCommandCenter
    var body: some View {
        ZStack {
            Color.black.opacity(0.9).ignoresSafeArea()
            VStack(spacing: 25) {
                Image(systemName: "lock.shield.fill").font(.system(size: 50)).foregroundColor(.yellow)
                Text("SYSTEM_APPROVAL_REQUIRED").font(.system(size: 10, design: .monospaced)).foregroundColor(.yellow)
                VStack(spacing: 10) {
                    Text(request.title).font(.title3).bold().foregroundColor(.white)
                    Text(request.description ?? "Administrative action pending.").font(.footnote).foregroundColor(.gray).multilineTextAlignment(.center)
                }
                HStack(spacing: 20) {
                    Button("[ DENY ]") { commandCenter.respondToAuth(approved: false) }.foregroundColor(.red).padding()
                    Button("[ APPROVE ]") { commandCenter.respondToAuth(approved: true) }.bold().foregroundColor(.yellow).padding()
                }
            }.padding(30).background(AntigravityTheme.background).cornerRadius(20).overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.white.opacity(0.1), lineWidth: 1))
        }
    }
}
