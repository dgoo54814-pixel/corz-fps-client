package dev.corz.fps;

import net.fabricmc.loader.api.FabricLoader;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Properties;

final class CorzSettings {
    private static final Path CONFIG = FabricLoader.getInstance().getConfigDir().resolve("corzfps.properties");
    private CorzSettings() {}

    static boolean loadShowFps() {
        Properties properties = new Properties();
        if (Files.exists(CONFIG)) {
            try (InputStream in = Files.newInputStream(CONFIG)) {
                properties.load(in);
            } catch (IOException ignored) { }
        }
        return Boolean.parseBoolean(properties.getProperty("show_fps", "true"));
    }

    static void saveShowFps(boolean value) {
        Properties properties = new Properties();
        properties.setProperty("show_fps", Boolean.toString(value));
        try {
            Files.createDirectories(CONFIG.getParent());
            try (OutputStream out = Files.newOutputStream(CONFIG)) {
                properties.store(out, "Corz FPS Client preferences");
            }
        } catch (IOException ignored) { }
    }
}
