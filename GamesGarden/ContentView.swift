import SwiftUI
import WebKit

/// Receives haptic requests from the games' JavaScript:
///   webkit.messageHandlers.haptic.postMessage("success")
/// Types: light | medium | heavy | success | warning | error
class HapticHandler: NSObject, WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController,
                               didReceive message: WKScriptMessage) {
        let type = message.body as? String ?? "light"
        DispatchQueue.main.async {
            switch type {
            case "success":
                UINotificationFeedbackGenerator().notificationOccurred(.success)
            case "warning":
                UINotificationFeedbackGenerator().notificationOccurred(.warning)
            case "error":
                UINotificationFeedbackGenerator().notificationOccurred(.error)
            case "medium":
                UIImpactFeedbackGenerator(style: .medium).impactOccurred()
            case "heavy":
                UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
            default:
                UIImpactFeedbackGenerator(style: .light).impactOccurred()
            }
        }
    }
}

struct ContentView: UIViewRepresentable {
    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.userContentController.add(HapticHandler(), name: "haptic")

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 0.059, green: 0.141, blue: 0.098, alpha: 1.0)
        webView.scrollView.backgroundColor = webView.backgroundColor
        webView.scrollView.bounces = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.showsVerticalScrollIndicator = false

        if let url = Bundle.main.url(forResource: "index", withExtension: "html"),
           let dir = Bundle.main.resourceURL {
            webView.loadFileURL(url, allowingReadAccessTo: dir)
        }
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}
}
