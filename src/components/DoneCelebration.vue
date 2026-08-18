<script setup lang="ts">
import { onBeforeUnmount, useTemplateRef, watch } from 'vue'
import { loadBasic } from '@tsparticles/basic'
import { loadLineShape } from '@tsparticles/shape-line'
import { loadInteractivityPlugin } from '@tsparticles/plugin-interactivity'
import { loadEmittersPlugin } from '@tsparticles/plugin-emitters'
import { loadLifeUpdater } from '@tsparticles/updater-life'
import { loadDestroyUpdater } from '@tsparticles/updater-destroy'
import { loadRotateUpdater } from '@tsparticles/updater-rotate'
import { tsParticles, type Container, type ISourceOptions } from '@tsparticles/engine'
import fireworksOptions from '@/config/particles/fireworks.json'

const props = defineProps<{ active: boolean }>()
const emit = defineEmits<{ done: [] }>()

const containerEl = useTemplateRef('containerEl')
const canvasId = 'done-celebration-canvas'

// Generous fixed timeout instead of polling particles.count === 0 — between
// two staggered rocket launches the container can genuinely have zero live
// particles for a moment, which would otherwise trigger cleanup mid-show.
const showDurationMs = 3000

let particlesContainer: Container | undefined
let cleanupTimeout: ReturnType<typeof setTimeout> | undefined

// The engine + its shape/mover/updater plugins only need registering once
// per page load, no matter how many times this component bursts — guarded
// at module scope so a second mount (or a second burst) reuses the same
// initialization instead of throwing on a duplicate loadBasic() call.
let engineReady: Promise<void> | undefined
function ensureEngineReady(): Promise<void> {
  engineReady ??= (async () => {
    await loadBasic(tsParticles)
    await loadLineShape(tsParticles)
    // plugin-emitters registers an interactor tied into the interactivity
    // system's lifecycle regardless of whether we use click/hover triggers
    // — omitting this throws "Interactivity Plugin is not loaded" at load
    // time even though this component never uses mouse/touch interactivity.
    await loadInteractivityPlugin(tsParticles)
    await loadEmittersPlugin(tsParticles)
    await loadLifeUpdater(tsParticles)
    await loadDestroyUpdater(tsParticles)
    await loadRotateUpdater(tsParticles)
    await tsParticles.init()
  })()
  return engineReady
}

async function play(): Promise<void> {
  await ensureEngineReady()
  if (!containerEl.value) return

  clearTimeout(cleanupTimeout)
  particlesContainer?.destroy()
  particlesContainer = await tsParticles.load({
    id: canvasId,
    element: containerEl.value,
    options: fireworksOptions as ISourceOptions,
  })

  cleanupTimeout = setTimeout(() => {
    particlesContainer?.destroy()
    particlesContainer = undefined
    emit('done')
  }, showDurationMs)
}

watch(
  () => props.active,
  (isActive) => {
    if (isActive) void play()
  },
)

onBeforeUnmount(() => {
  clearTimeout(cleanupTimeout)
  particlesContainer?.destroy()
})
</script>

<template>
  <Teleport to="body">
    <div ref="containerEl" class="celebration" aria-hidden="true"></div>
  </Teleport>
</template>

<style scoped>
.celebration {
  position: fixed;
  inset: 0;
  z-index: 1000;
  pointer-events: none;
}
</style>
