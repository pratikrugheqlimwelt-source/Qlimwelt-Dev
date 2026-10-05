import UIKit
import DeutschTranslateCore

/// Share sheet entry. iOS will not let the main app draw over the app the user
/// is in, so shared text is translated here and can be handed to the app.
@objc(ShareViewController)
final class ShareViewController: UIViewController {
    private let sourceLabel = UILabel()
    private let resultLabel = UILabel()
    private let errorLabel = UILabel()
    private let translateButton = UIButton(type: .system)
    private var sourceText = ""
    private let engine: any TranslationEngine = TranslateEngines.makeDefault()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 0.953, green: 0.933, blue: 0.902, alpha: 1)
        buildLayout()
        loadText()
    }

    private func buildLayout() {
        let title = UILabel()
        title.text = "Deutsch Widget"
        title.font = .boldSystemFont(ofSize: 20)
        title.textColor = UIColor(red: 0.110, green: 0.098, blue: 0.090, alpha: 1)

        sourceLabel.numberOfLines = 4
        sourceLabel.font = .systemFont(ofSize: 15)
        sourceLabel.textColor = UIColor(red: 0.110, green: 0.098, blue: 0.090, alpha: 1)

        resultLabel.numberOfLines = 6
        resultLabel.font = .systemFont(ofSize: 15)
        resultLabel.text = "Translation appears here"
        resultLabel.textColor = UIColor(red: 0.110, green: 0.098, blue: 0.090, alpha: 1)

        errorLabel.numberOfLines = 0
        errorLabel.font = .systemFont(ofSize: 13)
        errorLabel.textColor = UIColor(red: 0.608, green: 0.173, blue: 0.173, alpha: 1)
        errorLabel.isHidden = true

        translateButton.setTitle("Translate to German", for: .normal)
        translateButton.titleLabel?.font = .boldSystemFont(ofSize: 16)
        translateButton.backgroundColor = UIColor(red: 0.110, green: 0.098, blue: 0.090, alpha: 1)
        translateButton.setTitleColor(.white, for: .normal)
        translateButton.layer.cornerRadius = 12
        translateButton.addTarget(self, action: #selector(translateTapped), for: .touchUpInside)

        let openButton = UIButton(type: .system)
        openButton.setTitle("Open in app", for: .normal)
        openButton.addTarget(self, action: #selector(openTapped), for: .touchUpInside)

        let copyButton = UIButton(type: .system)
        copyButton.setTitle("Copy", for: .normal)
        copyButton.addTarget(self, action: #selector(copyTapped), for: .touchUpInside)

        let cancel = UIButton(type: .system)
        cancel.setTitle("Close", for: .normal)
        cancel.addTarget(self, action: #selector(closeTapped), for: .touchUpInside)

        let buttons = UIStackView(arrangedSubviews: [copyButton, openButton, cancel])
        buttons.axis = .horizontal
        buttons.distribution = .equalSpacing

        let stack = UIStackView(arrangedSubviews: [title, sourceLabel, translateButton, resultLabel, errorLabel, buttons])
        stack.axis = .vertical
        stack.spacing = 12
        stack.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(stack)
        NSLayoutConstraint.activate([
            stack.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            stack.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            stack.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 20),
            translateButton.heightAnchor.constraint(equalToConstant: 44),
        ])
    }

    private func loadText() {
        guard let item = extensionContext?.inputItems.first as? NSExtensionItem else { return }
        let providers = item.attachments ?? []
        let type = "public.plain-text"
        guard let provider = providers.first(where: { $0.hasItemConformingToTypeIdentifier(type) }) else { return }
        provider.loadItem(forTypeIdentifier: type, options: nil) { [weak self] item, _ in
            let text: String
            if let value = item as? String {
                text = value
            } else if let url = item as? URL, let value = try? String(contentsOf: url) {
                text = value
            } else {
                text = ""
            }
            DispatchQueue.main.async {
                self?.sourceText = text.trimmingCharacters(in: .whitespacesAndNewlines)
                self?.sourceLabel.text = self?.sourceText
            }
        }
    }

    @objc private func translateTapped() {
        let text = sourceText
        guard !text.isEmpty else {
            show(error: "Enter something to translate.")
            return
        }
        translateButton.isEnabled = false
        translateButton.setTitle("Translating…", for: .normal)
        Task {
            do {
                let result = try await engine.translate(
                    TranslateRequest(text: text, sourceLang: "auto", targetLang: "de")
                )
                await MainActor.run {
                    resultLabel.text = result.translatedText
                    errorLabel.isHidden = true
                    translateButton.isEnabled = true
                    translateButton.setTitle("Translate to German", for: .normal)
                }
            } catch {
                await MainActor.run {
                    show(error: (error as? LocalizedError)?.errorDescription ?? error.localizedDescription)
                    translateButton.isEnabled = true
                    translateButton.setTitle("Translate to German", for: .normal)
                }
            }
        }
    }

    @objc private func copyTapped() {
        let text = resultLabel.text ?? ""
        guard text != "Translation appears here" else { return }
        UIPasteboard.general.string = text
    }

    @objc private func openTapped() {
        let payload = sourceText.isEmpty ? (resultLabel.text ?? "") : sourceText
        let clipped = String(payload.prefix(1800))
        var components = URLComponents()
        components.scheme = "deustchwidget"
        components.host = "translate"
        components.queryItems = [URLQueryItem(name: "text", value: clipped)]
        guard let url = components.url else { return }
        extensionContext?.open(url, completionHandler: nil)
        var responder: UIResponder? = self
        let selector = sel_registerName("openURL:")
        while let current = responder {
            if current.responds(to: selector) {
                _ = current.perform(selector, with: url)
                break
            }
            responder = current.next
        }
        closeTapped()
    }

    @objc private func closeTapped() {
        extensionContext?.completeRequest(returningItems: nil)
    }

    private func show(error: String) {
        errorLabel.text = error
        errorLabel.isHidden = false
    }
}
