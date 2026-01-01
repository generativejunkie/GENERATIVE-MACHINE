// swift-tools-version: 5.10
import PackageDescription

let package = Package(
    name: "AntigravityUI",
    platforms: [
        .iOS(.v17)
    ],
    products: [
        .library(
            name: "AntigravityUI",
            targets: ["AntigravityUI"]),
    ],
    targets: [
        .target(
            name: "AntigravityUI",
            path: "Sources/AntigravityUI")
    ]
)
