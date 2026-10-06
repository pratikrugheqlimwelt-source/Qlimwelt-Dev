// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "DeutschTranslateCore",
    products: [
        .library(name: "DeutschTranslateCore", targets: ["DeutschTranslateCore"]),
    ],
    targets: [
        .target(name: "DeutschTranslateCore"),
        .testTarget(
            name: "DeutschTranslateCoreTests",
            dependencies: ["DeutschTranslateCore"]
        ),
    ]
)
