<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useThemeConfig } from '@/composables/useThemeConfig'
import {
  ACCENT_SWATCHES,
  DEFAULT_THEME_CONFIG,
  FONT_OPTIONS,
  PRESETS,
  RADIUS_OPTIONS,
  SPACING_OPTIONS,
  findMatchingPresetId,
} from '@/config/themePresets'
import type { ThemePreset } from '@/config/themePresets'
import ModalOverlay from './ModalOverlay.vue'
import DialogHeader from './DialogHeader.vue'
import SelectMenu from './SelectMenu.vue'

const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()
const { config, update, saveError } = useThemeConfig()

const activePresetId = computed(() => findMatchingPresetId(config))
const fontOptions = computed(() =>
  FONT_OPTIONS.map((font) => ({ value: font.id, label: t(`settings.fontNames.${font.id}`) })),
)

function applyPreset(preset: ThemePreset): void {
  update({ ...preset.config })
}

function setAccent(color: string | null): void {
  update({ accentColor: color })
}

function setFont(fontId: string): void {
  update({ fontId })
}

function setRadius(value: number): void {
  update({ radiusScale: value })
}

function setSpacing(value: number): void {
  update({ spacingScale: value })
}

function reset(): void {
  update({ ...DEFAULT_THEME_CONFIG })
}
</script>

<template>
  <ModalOverlay :open="true" @close="emit('close')">
    <div class="panel">
      <DialogHeader :title="t('settings.title')" @close="emit('close')" />

      <p v-if="saveError" class="save-error type-caption">
        {{ t('settings.saveError', { message: saveError }) }}
      </p>

      <div class="section">
        <span class="type-label section-label">{{ t('settings.presets') }}</span>
        <div class="preset-list">
          <button
            v-for="preset in PRESETS"
            :key="preset.id"
            type="button"
            class="preset-chip"
            :class="{ active: activePresetId === preset.id }"
            @click="applyPreset(preset)"
          >
            <span
              class="preset-dot"
              :style="{ background: preset.config.accentColor ?? 'var(--color-ink)' }"
            ></span>
            <span class="type-caption">{{ t(`settings.presetNames.${preset.id}`) }}</span>
          </button>
        </div>
      </div>

      <div class="section">
        <span class="type-label section-label">{{ t('settings.accentColor') }}</span>
        <div class="swatch-list">
          <button
            v-for="swatch in ACCENT_SWATCHES"
            :key="swatch"
            type="button"
            class="swatch"
            :class="{ active: config.accentColor === swatch }"
            :style="{ background: swatch }"
            :title="swatch"
            @click="setAccent(swatch)"
          ></button>
          <button
            type="button"
            class="swatch swatch-default"
            :class="{ active: config.accentColor === null }"
            :title="t('settings.accentDefault')"
            @click="setAccent(null)"
          >
            ×
          </button>
        </div>
      </div>

      <div class="section">
        <span class="type-label section-label">{{ t('settings.font') }}</span>
        <SelectMenu
          :model-value="config.fontId"
          :options="fontOptions"
          @update:model-value="setFont"
        />
        <p
          class="preview type-body"
          :style="{ fontFamily: FONT_OPTIONS.find((f) => f.id === config.fontId)?.stack }"
        >
          {{ t('settings.fontPreview') }}
        </p>
      </div>

      <div class="section">
        <span class="type-label section-label">{{ t('settings.radius') }}</span>
        <div class="segmented">
          <button
            v-for="option in RADIUS_OPTIONS"
            :key="option.id"
            type="button"
            class="segment"
            :class="{ active: config.radiusScale === option.value }"
            @click="setRadius(option.value)"
          >
            <span class="segment-preview" :style="{ borderRadius: `${6 * option.value}px` }"></span>
            <span class="type-caption">{{ t(`settings.radiusNames.${option.id}`) }}</span>
          </button>
        </div>
      </div>

      <div class="section">
        <span class="type-label section-label">{{ t('settings.spacing') }}</span>
        <div class="segmented">
          <button
            v-for="option in SPACING_OPTIONS"
            :key="option.id"
            type="button"
            class="segment"
            :class="{ active: config.spacingScale === option.value }"
            @click="setSpacing(option.value)"
          >
            <span class="type-caption">{{ t(`settings.spacingNames.${option.id}`) }}</span>
          </button>
        </div>
      </div>

      <button type="button" class="btn btn-secondary reset-btn" @click="reset">
        {{ t('settings.reset') }}
      </button>
    </div>
  </ModalOverlay>
</template>

<style scoped>
.panel {
  background: var(--color-canvas-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--rounded-lg);
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  max-height: calc(100vh - var(--space-xl) * 2);
  padding: var(--space-xl);
  overflow-y: auto;
}

/* border-radius matches every other bordered surface's {rounded.md}. */
.save-error {
  margin: 0;
  padding: 6px 8px;
  border-radius: var(--rounded-md);
  border: 1px solid var(--color-border-strong);
  color: var(--color-ink-secondary);
}

.section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-label {
  color: var(--color-ink-secondary);
}

.preset-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* border-radius is {rounded.lg}, not {rounded.full} — see StatusBadge.vue
   for why chips need a radius-scale-responsive value rather than a
   circle-guaranteeing fixed one. Especially relevant here: this chip
   previews/applies a preset that includes a radius value, so it should
   visibly react when the user later picks "sharp" below, not sit frozen
   as a permanent pill regardless of what's selected. */
.preset-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: var(--rounded-lg);
  border: 1px solid var(--color-border-strong);
  background: var(--color-canvas-surface);
  color: var(--color-ink);
  cursor: pointer;
}

.preset-chip.active {
  border-color: var(--color-accent);
}

.preset-dot {
  width: 10px;
  height: 10px;
  border-radius: var(--rounded-full);
  flex-shrink: 0;
}

.swatch-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.swatch {
  width: 24px;
  height: 24px;
  border-radius: var(--rounded-full);
  border: 1px solid var(--color-border-subtle);
  cursor: pointer;
  padding: 0;
}

.swatch.active {
  outline: 2px solid var(--color-ink);
  outline-offset: 2px;
}

.swatch-default {
  background: var(--color-canvas-app);
  color: var(--color-ink-secondary);
  font-size: 12px;
  line-height: 1;
}

.preview {
  margin: 0;
  color: var(--color-ink-secondary);
}

.segmented {
  display: flex;
  gap: 6px;
}

/* border-radius matches every other button's {rounded.md} — these are the
   Corner Radius/Spacing preset buttons, so of all things in this panel
   they'd be the most conspicuous to leave at a stale, un-unified radius. */
.segment {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px;
  border-radius: var(--rounded-md);
  border: 1px solid var(--color-border-strong);
  background: var(--color-canvas-surface);
  color: var(--color-ink-secondary);
  cursor: pointer;
}

.segment.active {
  border-color: var(--color-accent);
  color: var(--color-ink);
}

.segment-preview {
  width: 20px;
  height: 14px;
  border: 1.5px solid currentColor;
}

.reset-btn {
  align-self: flex-start;
}
</style>
