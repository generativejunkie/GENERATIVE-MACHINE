import SwiftUI
import Combine

// --- 1. THEME & STYLES ---
struct AntigravityTheme {
    static let background = Color(red: 0.02, green: 0.02, blue: 0.05)
    static let accent = Color(red: 0.0, green: 0.8, blue: 1.0)
    static let glass = Color.white.opacity(0.08)
}

// --- 2. COMMAND LOGIC (INTEGRATED) ---
class AntigravityCommandCenter: ObservableObject {
    @Published var lastResponse: String = "READY"
    @Published var isProcessing: Bool = false
    
    // MacOS IP
    private let targetServerHost = "192.168.11.41"
    private let targetPort = "8000"
    
    func sendCommand(type: String, detail: [String: String]? = nil) {
        let urlString = "http://\(targetServerHost):\(targetPort)/api/command"
        guard let url = URL(string: urlString) else { return }
        
        self.isProcessing = true
        self.lastResponse = "SENDING..."
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 5.0
        
        let body: [String: Any] = ["type": type, "detail": detail ?? [:]]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                self.isProcessing = false
                if let error = error {
                    self.lastResponse = "ERR: \(error.localizedDescription)"
                } else if let response = response as? HTTPURLResponse {
                    self.lastResponse = "OK: \(response.statusCode)"
                }
            }
        }
        task.resume()
    }
}

// --- 3. UI COMPONENTS ---
struct ActionButton: View {
    let title: String
    let icon: String
    let active: Bool
    let action: () -> Void
    
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 30))
                .foregroundColor(active ? .white : AntigravityTheme.accent)
            Text(title)
                .font(.caption)
                .bold()
                .foregroundColor(.white)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 30)
        .background(active ? AntigravityTheme.accent.opacity(0.3) : AntigravityTheme.glass)
        .cornerRadius(16)
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(AntigravityTheme.accent.opacity(0.4), lineWidth: 1))
        .contentShape(Rectangle())
        .onTapGesture {
            let impact = UIImpactFeedbackGenerator(style: .heavy)
            impact.impactOccurred()
            action()
        }
    }
}

// --- 4. MAIN VIEW ---
struct ContentView: View {
    @StateObject private var commandCenter = AntigravityCommandCenter()
    
    var body: some View {
        ZStack {
            AntigravityTheme.background.ignoresSafeArea()
            
            VStack(spacing: 30) {
                // Header
                VStack(spacing: 8) {
                    Text("ANTIGRAVITY")
                        .font(.system(.caption, design: .monospaced))
                        .foregroundColor(AntigravityTheme.accent)
                    Text("CENTRAL COMMAND")
                        .font(.title2)
                        .fontWeight(.light)
                        .foregroundColor(.white)
                }
                .padding(.top, 40)
                
                // Status Display
                Text(commandCenter.lastResponse)
                    .font(.system(.footnote, design: .monospaced))
                    .foregroundColor(commandCenter.lastResponse.contains("ERR") ? .red : AntigravityTheme.accent)
                    .padding(.vertical, 8)
                    .padding(.horizontal, 16)
                    .background(Color.white.opacity(0.05))
                    .cornerRadius(8)
                
                Spacer()
                
                // Grid Actions
                VStack(spacing: 20) {
                    HStack(spacing: 20) {
                        ActionButton(title: "VOID MODE", icon: "eye.slash.fill", active: commandCenter.isProcessing) {
                            commandCenter.sendCommand(type: "trigger-secret", detail: ["code": "void"])
                        }
                        ActionButton(title: "SYNC ALL", icon: "arrow.triangle.2.circlepath", active: commandCenter.isProcessing) {
                            commandCenter.sendCommand(type: "sync-pulse")
                        }
                    }
                    
                    HStack(spacing: 20) {
                        // Exit Void
                        ActionButton(title: "EXIT VOID", icon: "xmark.circle.fill", active: false) {
                            commandCenter.sendCommand(type: "trigger-secret-exit")
                        }
                        
                        // NEW: XCODE CONTROL
                        ActionButton(title: "XCODE REBUILD", icon: "hammer.fill", active: false) {
                            commandCenter.sendCommand(type: "rebuild-xcode")
                        }
                    }
                }
                .padding(.horizontal, 20)
                
                Spacer()
                
                // Manual Reset Button
                Button("REBOOT COMMANDER") {
                    commandCenter.isProcessing = false
                    commandCenter.lastResponse = "READY"
                }
                .font(.caption2)
                .foregroundColor(AntigravityTheme.accent.opacity(0.5))
                .padding(.bottom, 20)
            }
        }
    }
}
