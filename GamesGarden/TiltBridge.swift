//
//  TiltBridge.swift   (v3 — tilt input + per-page orientation)
//
//  ---------------------------------------------------------------------------
//  SETUP  (unchanged — if v2 is already working, just replace this file)
//
//    1. This file must be in your app target.
//    2. TiltBridge.autoInstall() called once at @main.
//
//  ---------------------------------------------------------------------------
//  WHAT'S NEW IN v3 — ORIENTATION PER GAME
//
//  Each game's HTML says which way up it wants to be, with one tag in its
//  <head>. The app reads it from whatever page is on screen and locks to that,
//  so your games can differ from each other:
//
//      <meta name="app-orientation" content="portrait">
//      <meta name="app-orientation" content="landscape">
//
//  A page with NO tag rotates freely, exactly as it does today. So your other
//  games need no changes at all — only add the tag to the ones you want pinned.
//  maze-escape.html already carries the portrait tag.
//
//  Native screens (menus, anything that isn't a web view) also rotate freely.
//
//  This needs no extra wiring: the bridge installs the orientation hook onto
//  your app delegate itself. If it can't, it says so in the console and you can
//  use the manual fallback at the bottom of this file.
//  ---------------------------------------------------------------------------

import UIKit
import WebKit
import CoreMotion
import ObjectiveC

@objc final class TiltBridge: NSObject {

    // MARK: - Public

    @objc static let shared = TiltBridge()

    /// Readings per second pushed into the page. 60 is smooth, 30 is lighter.
    var updatesPerSecond: Double = 60 {
        didSet { motion.deviceMotionUpdateInterval = 1.0 / max(1, updatesPerSecond) }
    }

    /// Print progress to the Xcode console. Set false once everything works.
    @objc static var debug = true

    /// Let pages control orientation via <meta name="app-orientation">.
    /// Set false if you'd rather handle orientation yourself.
    @objc static var managesOrientation = true

    /// Start motion, feed every WKWebView on screen, follow each page's
    /// orientation tag. Call once at launch.
    @objc static func autoInstall() {
        shared.autoMode = true
        shared.startUpdates()
    }

    /// Feed one specific web view instead.
    @objc func start(feeding webView: WKWebView) {
        explicitWebView = webView
        autoMode = false
        startUpdates()
    }

    @objc func stop() {
        wantsUpdates = false
        motion.stopDeviceMotionUpdates()
        log("motion stopped")
    }

    // MARK: - State

    private let motion = CMMotionManager()
    private weak var explicitWebView: WKWebView?
    private var autoMode = false
    private var wantsUpdates = false

    private var cachedViews: [WKWebView] = []
    private var lastScan = Date.distantPast
    private var lastReport = Date.distantPast
    private var pushCount = 0

    /// What the page on screen is asking for. Read by the app delegate hook.
    fileprivate var currentMask: UIInterfaceOrientationMask = .all
    private var hookInstalled = false
    private var originalOrientationIMP: IMP?

    private override init() {
        super.init()
        motion.deviceMotionUpdateInterval = 1.0 / updatesPerSecond
        NotificationCenter.default.addObserver(
            self, selector: #selector(appBackgrounded),
            name: UIApplication.didEnterBackgroundNotification, object: nil)
        NotificationCenter.default.addObserver(
            self, selector: #selector(appForegrounded),
            name: UIApplication.willEnterForegroundNotification, object: nil)
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
        motion.stopDeviceMotionUpdates()
    }

    // MARK: - Motion

    private func startUpdates() {
        wantsUpdates = true
        guard motion.isDeviceMotionAvailable else {
            log("device motion NOT available (Simulator? tilt needs a real device)")
            return
        }
        guard !motion.isDeviceMotionActive else { return }

        motion.startDeviceMotionUpdates(using: .xArbitraryZVertical, to: .main) { [weak self] data, error in
            guard let self = self else { return }
            if let error = error {
                self.log("motion error – \(error.localizedDescription)")
                return
            }
            guard let gravity = data?.gravity else { return }

            let beta  = atan2(-gravity.y, -gravity.z) * 180 / .pi   // tilt away / toward you
            let gamma = atan2( gravity.x, -gravity.z) * 180 / .pi   // tilt left / right
            self.push(beta: beta, gamma: gamma)
        }
        log(String(format: "motion started (%.0f Hz)", updatesPerSecond))
    }

    private func push(beta: Double, gamma: Double) {
        let targets: [WKWebView]
        if autoMode {
            if Date().timeIntervalSince(lastScan) > 1.0 {
                lastScan = Date()
                let found = Self.visibleWebViews()
                if found.count != cachedViews.count {
                    log(found.isEmpty ? "no WKWebView on screen yet"
                                      : "feeding \(found.count) web view\(found.count == 1 ? "" : "s")")
                }
                cachedViews = found
                if Self.managesOrientation {
                    installOrientationHookIfNeeded()
                    readOrientationPreference(from: found)
                }
            }
            targets = cachedViews
        } else {
            targets = [explicitWebView].compactMap { $0 }
        }
        guard !targets.isEmpty else { return }

        let js = String(format:
            "if(window.MazeEscape&&MazeEscape.setTilt){MazeEscape.setTilt(%.2f,%.2f);}",
            beta, gamma)
        for web in targets { web.evaluateJavaScript(js, completionHandler: nil) }

        pushCount += 1
        if Self.debug, Date().timeIntervalSince(lastReport) > 2.0 {
            lastReport = Date()
            log(String(format: "sent %d readings — beta %.1f°, gamma %.1f°", pushCount, beta, gamma))
        }
    }

    private static func visibleWebViews() -> [WKWebView] {
        var found: [WKWebView] = []
        func walk(_ view: UIView) {
            if let web = view as? WKWebView { found.append(web) }
            for sub in view.subviews { walk(sub) }
        }
        for scene in UIApplication.shared.connectedScenes {
            guard let windowScene = scene as? UIWindowScene else { continue }
            for window in windowScene.windows where !window.isHidden { walk(window) }
        }
        return found
    }

    // MARK: - Orientation the page asks for

    private func readOrientationPreference(from webs: [WKWebView]) {
        guard let web = webs.last else {          // topmost web view wins
            setMask(.all)
            return
        }
        let js = #"""
        (function(){var m=document.querySelector('meta[name="app-orientation"]');
        return m ? (m.content||'') : '';})()
        """#
        web.evaluateJavaScript(js) { [weak self] result, _ in
            guard let self = self else { return }
            switch (result as? String)?.lowercased() {
            case "portrait":         self.setMask(.portrait)
            case "landscape":        self.setMask(.landscape)
            case "portraitupsidedown", "allbutupsidedown":
                                     self.setMask(.allButUpsideDown)
            default:                 self.setMask(.all)
            }
        }
    }

    private func setMask(_ mask: UIInterfaceOrientationMask) {
        guard mask != currentMask else { return }
        currentMask = mask
        log("orientation → \(describe(mask))")

        guard let scene = UIApplication.shared.connectedScenes
                .compactMap({ $0 as? UIWindowScene })
                .first(where: { $0.activationState == .foregroundActive })
                ?? UIApplication.shared.connectedScenes.compactMap({ $0 as? UIWindowScene }).first
        else { return }

        let root = scene.windows.first(where: { $0.isKeyWindow })?.rootViewController
        if #available(iOS 16.0, *) {
            root?.setNeedsUpdateOfSupportedInterfaceOrientations()
            scene.requestGeometryUpdate(.iOS(interfaceOrientations: mask)) { [weak self] error in
                self?.log("rotation request refused – \(error.localizedDescription)")
            }
        } else {
            UIViewController.attemptRotationToDeviceOrientation()
        }
    }

    /// Adds `application(_:supportedInterfaceOrientationsFor:)` to the app
    /// delegate at runtime, so you don't have to write it yourself.
    private func installOrientationHookIfNeeded() {
        guard !hookInstalled else { return }
        guard let delegate = UIApplication.shared.delegate else { return }  // not ready yet; retry next scan

        let cls: AnyClass = type(of: delegate)
        let selector = NSSelectorFromString("application:supportedInterfaceOrientationsForWindow:")

        // NSUInteger in, NSUInteger out — matches UIInterfaceOrientationMask's ABI.
        let block: @convention(block) (AnyObject, UIApplication, UIWindow?) -> UInt = { [weak self] _, _, _ in
            self?.currentMask.rawValue ?? UIInterfaceOrientationMask.all.rawValue
        }
        let newIMP = imp_implementationWithBlock(block)

        if let existing = class_getInstanceMethod(cls, selector) {
            originalOrientationIMP = method_getImplementation(existing)
            method_setImplementation(existing, newIMP)
            log("orientation control installed (replaced existing method on \(cls))")
        } else if class_addMethod(cls, selector, newIMP, "Q@:@@") {
            log("orientation control installed on \(cls)")
        } else {
            log("could NOT install orientation control — use the manual fallback in TiltBridge.swift")
            return
        }
        hookInstalled = true
    }

    private func describe(_ mask: UIInterfaceOrientationMask) -> String {
        if mask == .portrait { return "portrait" }
        if mask == .landscape { return "landscape" }
        if mask == .allButUpsideDown { return "all but upside down" }
        return "free"
    }

    @objc private func appBackgrounded() { motion.stopDeviceMotionUpdates() }
    @objc private func appForegrounded() { if wantsUpdates { startUpdates() } }

    private func log(_ message: String) {
        if Self.debug { print("TiltBridge: \(message)") }
    }
}


// =============================================================================
// MARK: - Manual fallback
//
// Only needed if the console says the orientation control could not install.
// Set TiltBridge.managesOrientation = false, then add this method to your own
// AppDelegate (UIKit), or to a delegate attached with @UIApplicationDelegateAdaptor
// (SwiftUI), and it will do exactly the same job:
//
//   func application(_ application: UIApplication,
//                    supportedInterfaceOrientationsFor window: UIWindow?)
//                    -> UIInterfaceOrientationMask {
//       TiltBridge.shared.pageOrientationMask
//   }
//
// (expose it by adding `@objc var pageOrientationMask: UIInterfaceOrientationMask
//  { currentMask }` to the class above)
// =============================================================================
