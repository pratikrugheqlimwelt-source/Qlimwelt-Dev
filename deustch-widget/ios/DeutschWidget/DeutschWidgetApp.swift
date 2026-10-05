import SwiftUI
import DeutschTranslateCore

@main
struct DeutschWidgetApp: App {
    @StateObject private var model = TranslatorModel()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(model)
                .onOpenURL { url in
                    model.consume(url: url)
                }
        }
    }
}
