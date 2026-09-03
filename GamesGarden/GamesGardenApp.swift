import SwiftUI

@main
struct GamesGardenApp: App {
    init() { TiltBridge.autoInstall() } 
    var body: some Scene {
        WindowGroup {
            ContentView()
                .ignoresSafeArea()
                .preferredColorScheme(.dark)
                .statusBarHidden(true)
        }
    }
    
}
