package dev.corz.fps;

import net.minecraft.client.CloudStatus;
import net.minecraft.client.Minecraft;
import net.minecraft.client.Options;
import net.minecraft.client.gui.GuiGraphicsExtractor;
import net.minecraft.client.gui.components.Button;
import net.minecraft.client.gui.screens.Screen;
import net.minecraft.network.chat.Component;
import net.minecraft.server.level.ParticleStatus;

/** In-game graphics settings accessible with Right Shift. */
public final class CorzFpsScreen extends Screen {
    public CorzFpsScreen() {
        super(Component.literal("Corz FPS Client"));
    }

    @Override
    protected void init() {
        int x = this.width / 2 - 154;
        int y = this.height / 2 - 82;
        int w = 150;
        int gap = 8;
        Options options = this.minecraft.options;

        addRenderableWidget(Button.builder(Component.literal("MAX FPS"), button -> {
            applyFastProfile(options);
            refresh();
        }).bounds(x, y, w, 20).build());

        addRenderableWidget(Button.builder(Component.literal("BALANCED"), button -> {
            applyBalancedProfile(options);
            refresh();
        }).bounds(x + w + gap, y, w, 20).build());

        addRenderableWidget(Button.builder(Component.literal("FPS HUD: " + onOff(CorzFpsClient.showFps)), button -> {
            CorzFpsClient.showFps = !CorzFpsClient.showFps;
            CorzSettings.saveShowFps(CorzFpsClient.showFps);
            refresh();
        }).bounds(x, y + 29, w, 20).build());

        addRenderableWidget(Button.builder(Component.literal("CLOUDS: " + onOff(options.cloudStatus().get() != CloudStatus.OFF)), button -> {
            options.cloudStatus().set(options.cloudStatus().get() == CloudStatus.OFF ? CloudStatus.FAST : CloudStatus.OFF);
            options.save();
            refresh();
        }).bounds(x + w + gap, y + 29, w, 20).build());

        addRenderableWidget(Button.builder(Component.literal("PARTICLES: " + (options.particles().get() == ParticleStatus.MINIMAL ? "MIN" : "NORMAL")), button -> {
            options.particles().set(options.particles().get() == ParticleStatus.MINIMAL ? ParticleStatus.ALL : ParticleStatus.MINIMAL);
            options.save();
            refresh();
        }).bounds(x, y + 58, w, 20).build());

        addRenderableWidget(Button.builder(Component.literal("SHADOWS: " + onOff(options.entityShadows().get())), button -> {
            options.entityShadows().set(!options.entityShadows().get());
            options.save();
            refresh();
        }).bounds(x + w + gap, y + 58, w, 20).build());

        addRenderableWidget(Button.builder(Component.literal("- VIEW DISTANCE"), button -> {
            int old = options.renderDistance().get();
            options.renderDistance().set(Math.max(2, old - 2));
            options.save();
            refresh();
        }).bounds(x, y + 87, w, 20).build());

        addRenderableWidget(Button.builder(Component.literal("+ VIEW DISTANCE"), button -> {
            int old = options.renderDistance().get();
            options.renderDistance().set(Math.min(32, old + 2));
            options.save();
            refresh();
        }).bounds(x + w + gap, y + 87, w, 20).build());

        addRenderableWidget(Button.builder(Component.literal("CLOSE"), button -> onClose())
                .bounds(x, y + 121, w * 2 + gap, 20).build());
    }

    private void refresh() {
        this.minecraft.setScreen(new CorzFpsScreen());
    }

    private static String onOff(boolean yes) {
        return yes ? "ON" : "OFF";
    }

    private static void applyFastProfile(Options options) {
        options.renderDistance().set(6);
        options.cloudStatus().set(CloudStatus.OFF);
        options.particles().set(ParticleStatus.MINIMAL);
        options.entityShadows().set(false);
        options.ambientOcclusion().set(false);
        options.biomeBlendRadius().set(0);
        options.save();
    }

    private static void applyBalancedProfile(Options options) {
        options.renderDistance().set(10);
        options.cloudStatus().set(CloudStatus.FAST);
        options.particles().set(ParticleStatus.DECREASED);
        options.entityShadows().set(false);
        options.ambientOcclusion().set(true);
        options.biomeBlendRadius().set(2);
        options.save();
    }

    @Override
    public void onClose() {
        Minecraft.getInstance().setScreen(null);
    }

    @Override
    public void extractRenderState(GuiGraphicsExtractor graphics, int mouseX, int mouseY, float delta) {
        super.extractRenderState(graphics, mouseX, mouseY, delta);
        int center = this.width / 2;
        int top = this.height / 2 - 124;
        String title = "CORZ FPS CLIENT";
        graphics.text(this.font, title, center - this.font.width(title) / 2, top, 0xFF67E8F9, true);
        String subtitle = "FABRIC 26.1.2 | " + this.minecraft.getFps() + " FPS | VIEW: "
                + this.minecraft.options.renderDistance().get() + " CHUNKS";
        graphics.text(this.font, subtitle, center - this.font.width(subtitle) / 2, top + 18, 0xFFE0E7FF, true);
    }
}
