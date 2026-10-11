# Corz FPS Client — Fabric 26.1.2

Source code for a client-side Minecraft FPS settings mod. It is not a remote administration tool.

## Features
- Press **Right Shift** to open an in-game settings menu.
- FPS overlay and optional hide toggle.
- **MAX FPS** and **Balanced** graphics presets.
- Clouds, particles, entity shadows, render distance controls.

This mod adjusts standard Minecraft graphics options. FPS gains are not guaranteed.

## Get the JAR

Open [GitHub Actions](../../actions), choose **Build Corz FPS Mod**, select the latest successful build, and download the `corzfps-fabric-26.1.2` artifact. Extract the **JAR** inside the artifact ZIP. Upload that JAR to Modrinth; do not upload this source archive.

Minecraft 26.1.2, Fabric Loader 0.19.5, Fabric API 0.155.3+26.1.2, Java 25.

## Build

With JDK 25 and Gradle 9.3.0 run `gradle build`. Build validation occurs in the Actions workflow and is required before distributing the JAR.
