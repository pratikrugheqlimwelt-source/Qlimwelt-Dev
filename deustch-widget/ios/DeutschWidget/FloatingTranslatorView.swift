import SwiftUI
import DeutschTranslateCore

struct FloatingTranslatorView: View {
    @EnvironmentObject private var model: TranslatorModel
    @State private var position = CGPoint(x: -1, y: -1)
    @State private var dragOrigin = CGPoint.zero
    @State private var dragging = false
    @State private var pickingSource = true
    @State private var showingPicker = false

    private let ink = Color(red: 0.110, green: 0.098, blue: 0.090)
    private let paper = Color(red: 0.965, green: 0.945, blue: 0.910)
    private let card = Color(red: 1, green: 0.988, blue: 0.969)
    private let line = Color(red: 0.894, green: 0.851, blue: 0.784)
    private let accent = Color(red: 0.769, green: 0.361, blue: 0.149)
    private let muted = Color(red: 0.435, green: 0.404, blue: 0.369)
    private let error = Color(red: 0.608, green: 0.173, blue: 0.173)

    var body: some View {
        GeometryReader { geo in
            Group {
                if model.expanded {
                    panel(in: geo)
                } else {
                    bubble.gesture(drag(in: geo, toggles: true))
                }
            }
            .position(resolved(in: geo))
            .onAppear { position = resolved(in: geo) }
            .onChange(of: model.expanded) { _, _ in
                position = resolved(in: geo)
            }
        }
        .ignoresSafeArea()
    }

    private var bubble: some View {
        Text("De")
            .font(.system(size: 18, weight: .bold))
            .foregroundStyle(card)
            .frame(width: 56, height: 56)
            .background(ink)
            .clipShape(Circle())
            .shadow(color: .black.opacity(0.18), radius: 8, y: 4)
            .accessibilityLabel("Open translator")
    }

    private func panel(in geo: GeometryProxy) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("Deutsch Widget")
                    .font(.subheadline.bold())
                    .foregroundStyle(ink)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .contentShape(Rectangle())
                    .gesture(drag(in: geo, toggles: false))
                Button("Close") { model.expanded = false }
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(ink)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(paper)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                    .accessibilityLabel("Close translator")
            }
            HStack(spacing: 8) {
                langButton(Languages.label(for: model.sourceLang)) { openPicker(source: true) }
                Button {
                    model.swap()
                } label: {
                    Text("⇄")
                        .frame(width: 40, height: 40)
                        .foregroundStyle(accent)
                        .background(paper)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                }
                .accessibilityLabel("Swap languages")
                langButton(Languages.label(for: model.targetLang)) { openPicker(source: false) }
            }
            if showingPicker {
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        let options = pickingSource ? [Languages.auto] + Languages.all : Languages.all
                        ForEach(options, id: \.code) { language in
                            Button(language.label) {
                                if pickingSource {
                                    model.selectSource(language.code)
                                } else {
                                    model.selectTarget(language.code)
                                }
                                showingPicker = false
                            }
                            .font(.subheadline)
                            .foregroundStyle(ink)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.vertical, 8)
                            .padding(.horizontal, 10)
                        }
                    }
                }
                .frame(height: 180)
                .background(paper)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            Text(model.pairLabel)
                .font(.caption)
                .foregroundStyle(muted)
            TextField("Text to translate", text: $model.sourceText, axis: .vertical)
                .lineLimit(2...4)
                .padding(12)
                .background(paper)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            Button {
                Task { await model.translate() }
            } label: {
                Text(model.isTranslating ? "Translating…" : "Translate")
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .foregroundStyle(card)
                    .background(ink)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .disabled(model.isTranslating)
            Text(model.translatedText.isEmpty ? "Translation appears here" : model.translatedText)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(12)
                .foregroundStyle(ink)
                .background(paper)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            if let errorMessage = model.errorMessage {
                Text(errorMessage)
                    .font(.footnote)
                    .foregroundStyle(error)
            }
            HStack {
                Button("Copy") { copy() }
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(ink)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(paper)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                    .accessibilityLabel("Copy translation")
                Spacer()
                Text("MyMemory · no account")
                    .font(.caption2)
                    .foregroundStyle(muted)
            }
        }
        .padding(14)
        .frame(width: 300)
        .background(card)
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .overlay(RoundedRectangle(cornerRadius: 20).stroke(line, lineWidth: 1))
        .shadow(color: .black.opacity(0.16), radius: 16, y: 8)
    }

    private func langButton(_ title: String, action: @escaping () -> Void) -> some View {
        Button(title, action: action)
            .font(.footnote.weight(.semibold))
            .foregroundStyle(ink)
            .frame(maxWidth: .infinity)
            .frame(height: 40)
            .background(paper)
            .clipShape(RoundedRectangle(cornerRadius: 10))
    }

    private func openPicker(source: Bool) {
        if showingPicker && pickingSource == source {
            showingPicker = false
        } else {
            pickingSource = source
            showingPicker = true
        }
    }

    private func copy() {
        guard !model.translatedText.isEmpty else { return }
        #if canImport(UIKit)
        UIPasteboard.general.string = model.translatedText
        #endif
    }

    private func drag(in geo: GeometryProxy, toggles: Bool) -> some Gesture {
        DragGesture(minimumDistance: 0)
            .onChanged { value in
                if !dragging {
                    dragOrigin = resolved(in: geo)
                }
                let travel = hypot(value.translation.width, value.translation.height)
                if travel > 6 { dragging = true }
                if dragging {
                    position = CGPoint(
                        x: dragOrigin.x + value.translation.width,
                        y: dragOrigin.y + value.translation.height
                    )
                }
            }
            .onEnded { _ in
                if dragging {
                    let size = model.expanded ? CGSize(width: 300, height: 360) : CGSize(width: 56, height: 56)
                    let snapRight = position.x >= geo.size.width / 2
                    let margin: CGFloat = 12 + size.width / 2
                    let x = snapRight ? geo.size.width - margin : margin
                    let minY = 12 + size.height / 2
                    let maxY = max(minY, geo.size.height - 12 - size.height / 2)
                    let y = min(max(position.y, minY), maxY)
                    position = CGPoint(x: x, y: y)
                    let fraction = Double(y / max(geo.size.height, 1))
                    model.rememberPosition(snapRight: snapRight, yFraction: fraction)
                } else if toggles {
                    model.expanded = true
                }
                dragging = false
            }
    }

    private func resolved(in geo: GeometryProxy) -> CGPoint {
        let size = model.expanded ? CGSize(width: 300, height: 420) : CGSize(width: 56, height: 56)
        let margin: CGFloat = 12 + size.width / 2
        let x = model.snapRight ? geo.size.width - margin : margin
        let y = min(max(CGFloat(model.yFraction) * geo.size.height, 80), geo.size.height - 80)
        if position.x < 0 || !dragging {
            return CGPoint(x: x, y: y)
        }
        return position
    }
}
