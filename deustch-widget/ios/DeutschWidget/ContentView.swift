import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var model: TranslatorModel

    var body: some View {
        ZStack {
            Color(red: 0.953, green: 0.933, blue: 0.902)
                .ignoresSafeArea()
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    Text("DEUSTCH WIDGET")
                        .font(.caption.weight(.semibold))
                        .tracking(1.4)
                        .foregroundStyle(Color(red: 0.769, green: 0.361, blue: 0.149))
                    Text("Deutsch Widget")
                        .font(.largeTitle.bold())
                        .foregroundStyle(Color(red: 0.110, green: 0.098, blue: 0.090))
                    Text("A small translator for German. The bubble on this screen opens and closes the translator, and it snaps to the side when you drag it.")
                        .foregroundStyle(Color(red: 0.435, green: 0.404, blue: 0.369))
                    VStack(alignment: .leading, spacing: 8) {
                        Text("iOS cannot float over other apps")
                            .font(.headline)
                            .foregroundStyle(Color(red: 0.110, green: 0.098, blue: 0.090))
                        Text("Apple does not allow a third-party app to draw a bubble on top of other apps. This is an in-app floater only. To send text in from Safari, Notes, or another app, share it and choose Deutsch Widget.")
                            .font(.subheadline)
                            .foregroundStyle(Color(red: 0.435, green: 0.404, blue: 0.369))
                    }
                    .padding(16)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color(red: 1, green: 0.988, blue: 0.969))
                    .clipShape(RoundedRectangle(cornerRadius: 18))
                    .overlay(
                        RoundedRectangle(cornerRadius: 18)
                            .stroke(Color(red: 0.894, green: 0.851, blue: 0.784), lineWidth: 1)
                    )
                    Text("Drag the De button. Tap it to translate. Close, or tap it again, to collapse it.")
                        .font(.subheadline)
                        .foregroundStyle(Color(red: 0.435, green: 0.404, blue: 0.369))
                }
                .padding(24)
                .padding(.bottom, 80)
            }
            FloatingTranslatorView()
        }
    }
}
