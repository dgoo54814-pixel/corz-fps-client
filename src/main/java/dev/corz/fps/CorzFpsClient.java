package dev.corz.fps;

import com.mojang.blaze3d.platform.InputConstants;
import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.fabricmc.fabric.api.client.keymapping.v1.KeyMappingHelper;
import net.fabricmc.fabric.api.client.rendering.v1.hud.HudElementRegistry;
import net.fabricmc.fabric.api.client.rendering.v1.hud.VanillaHudElements;
import net.minecraft.client.KeyMapping;
import net.minecraft.client.Minecraft;
import net.minecraft.resources.Identifier;

public final class CorzFpsClient implements ClientModInitializer {
    public static final String MOD_ID = "corzfps";
    public static boolean showFps = true;

    @Override
    public void onInitializeClient() {
        showFps = CorzSettings.loadShowFps();
        KeyMapping.Category category = KeyMapping.Category.register(
                Identifier.fromNamespaceAndPath(MOD_ID, "client")
        );
        KeyMapping openMenu = KeyMappingHelper.registerKeyMapping(new KeyMapping(
                "key.corzfps.open_menu",
                InputConstants.Type.KEYSYM,
                InputConstants.KEY_RSHIFT,
                category
        ));
        ClientTickEvents.END_CLIENT_TICK.register(client -> {
            while (openMenu.consumeClick()) {
                if (client.screen == null) {
                    client.setScreen(new CorzFpsScreen());
                }
            }
        });
        HudElementRegistry.attachElementBefore(
                VanillaHudElements.CHAT,
                Identifier.fromNamespaceAndPath(MOD_ID, "fps_hud"),
                (graphics, tickDelta) -> {
                    Minecraft minecraft = Minecraft.getInstance();
                    if (!showFps || minecraft.level == null || minecraft.options.hideGui) return;
                    String text = "CORZ | " + minecraft.getFps() + " FPS";
                    int width = minecraft.font.width(text);
                    graphics.fill(6, 6, 18 + width, 24, 0xB9000E1A);
                    graphics.text(minecraft.font, text, 12, 11, 0xFF67E8F9, true);
                }
        );
    }
}
