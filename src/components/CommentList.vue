<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWorkItemsStore } from '@/stores/workItems'
import type { Comment } from '@/types/work-item'
import ActionIcon from '@/components/ActionIcon.vue'

const props = defineProps<{ itemId: string; comments: Comment[] }>()

const { t, locale } = useI18n()
const store = useWorkItemsStore()
const newCommentText = ref('')
const submitting = ref(false)

function formatDate(value: string): string {
  return new Date(value).toLocaleString(locale.value)
}

async function submitComment(): Promise<void> {
  const text = newCommentText.value.trim()
  if (!text) return
  submitting.value = true
  try {
    await store.addComment(props.itemId, text)
    newCommentText.value = ''
  } finally {
    submitting.value = false
  }
}

async function removeComment(commentId: string): Promise<void> {
  await store.deleteComment(props.itemId, commentId)
}
</script>

<template>
  <div class="comment-list">
    <h2 class="type-section-title">{{ t('comments.title') }}</h2>
    <p v-if="comments.length === 0" class="type-body empty">{{ t('comments.empty') }}</p>
    <ul v-else class="comments">
      <li v-for="comment in comments" :key="comment.id" class="comment">
        <div class="comment-body">
          <p class="type-body text">{{ comment.text }}</p>
          <span class="type-caption meta">{{ formatDate(comment.createdAt) }}</span>
        </div>
        <button type="button" class="btn btn-ghost remove" @click="removeComment(comment.id)">
          {{ t('common.delete') }}
        </button>
      </li>
    </ul>

    <form class="new-comment" @submit.prevent="submitComment">
      <textarea
        v-model="newCommentText"
        class="input type-body"
        rows="2"
        :placeholder="t('comments.placeholder')"
      ></textarea>
      <button
        type="submit"
        class="btn btn-primary"
        :disabled="submitting || !newCommentText.trim()"
      >
        <ActionIcon type="add" />
        <span class="icon-label">{{ t('comments.submit') }}</span>
      </button>
    </form>
  </div>
</template>

<style scoped>
.comment-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.empty {
  color: var(--color-ink-muted);
}

.comments {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.comment {
  display: flex;
  justify-content: space-between;
  gap: var(--space-sm);
  border-bottom: 1px solid var(--color-border-subtle);
  padding-bottom: var(--space-sm);
}

.comment-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.text {
  white-space: pre-wrap;
}

.meta {
  color: var(--color-ink-muted);
}

.remove {
  min-height: 28px;
  padding: 4px 10px;
  height: fit-content;
}

.new-comment {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  align-items: flex-start;
}
</style>
