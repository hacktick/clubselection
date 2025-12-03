<script setup lang="ts">
import { ref, computed } from 'vue';
import { api } from '@/services/api';
import { BaseModal, BaseButton, BaseTextarea, BaseAlert } from '@/components/ui';

const props = defineProps<{
  modelValue: boolean;
  projectId: string;
  projectName: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

interface ExportResult {
  project: {
    id: string;
    name: string;
  };
  submissions: Array<{
    identifier: string;
    token: string;
    studentName: string | null;
    submittedAt: string | null;
    enrollments: Array<{
      courseName: string;
      status: string;
    }>;
  }>;
  notFound: string[];
}

const step = ref<'input' | 'result'>('input');
const identifiers = ref('');
const exporting = ref(false);
const error = ref('');
const result = ref<ExportResult | null>(null);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

function resetState() {
  step.value = 'input';
  identifiers.value = '';
  error.value = '';
  result.value = null;
  exporting.value = false;
}

function close() {
  isOpen.value = false;
  resetState();
}

async function exportSubmissions() {
  if (!identifiers.value.trim()) return;

  exporting.value = true;
  error.value = '';

  try {
    const lines = identifiers.value
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const response = await api.post(`/api/admin/projects/${props.projectId}/submissions/export`, {
      identifiers: lines,
    });

    const data = await response.json();

    if (!response.ok) {
      error.value = data.error || 'Export fehlgeschlagen';
      return;
    }

    result.value = data;
    step.value = 'result';
  } catch (err) {
    error.value = 'Netzwerkfehler. Bitte versuchen Sie es erneut.';
    console.error('Error exporting submissions:', err);
  } finally {
    exporting.value = false;
  }
}

function copyToClipboard() {
  if (!result.value) return;
  navigator.clipboard.writeText(JSON.stringify(result.value, null, 2));
}

function downloadJson() {
  if (!result.value) return;
  const blob = new Blob([JSON.stringify(result.value, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${props.projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-submissions.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function goBack() {
  step.value = 'input';
  result.value = null;
  error.value = '';
}
</script>

<template>
  <BaseModal v-model="isOpen" :title="step === 'input' ? 'Submissions exportieren' : 'Export Ergebnis'" large>
    <div v-if="step === 'input'" class="export-input">
      <p class="export-description">
        Geben Sie die Schüler-Kennungen ein (eine pro Zeile), um deren Submissions zu exportieren.
        Die Kennungen werden zu Tokens gehasht und mit den gespeicherten Daten abgeglichen.
      </p>

      <fieldset>
        <label for="identifiers">Schüler-Kennungen</label>
        <BaseTextarea
          id="identifiers"
          v-model="identifiers"
          :rows="12"
          placeholder="max.mustermann@schule.de
anna.schmidt@schule.de
12345
67890"
        />
      </fieldset>

      <BaseAlert v-if="error" type="error">{{ error }}</BaseAlert>
    </div>

    <div v-else-if="step === 'result'" class="export-result">
      <div v-if="result && result.notFound.length > 0" class="not-found-warning">
        <BaseAlert type="warning">
          {{ result.notFound.length }} Kennung(en) nicht gefunden:
          <code>{{ result.notFound.join(', ') }}</code>
        </BaseAlert>
      </div>

      <div class="result-stats">
        <span><strong>{{ result?.submissions.length || 0 }}</strong> Schüler gefunden</span>
      </div>

      <div class="result-preview">
        <pre>{{ JSON.stringify(result, null, 2) }}</pre>
      </div>
    </div>

    <template #footer>
      <div class="modal-actions">
        <BaseButton v-if="step === 'result'" variant="secondary" @click="goBack">
          Zurück
        </BaseButton>
        <BaseButton v-else variant="secondary" @click="close" :disabled="exporting">
          Abbrechen
        </BaseButton>

        <template v-if="step === 'result'">
          <BaseButton variant="secondary" @click="copyToClipboard">
            Kopieren
          </BaseButton>
          <BaseButton variant="primary" @click="downloadJson">
            Download JSON
          </BaseButton>
        </template>
        <template v-else>
          <BaseButton
            variant="primary"
            @click="exportSubmissions"
            :disabled="!identifiers.trim() || exporting"
            :loading="exporting"
          >
            Exportieren
          </BaseButton>
        </template>
      </div>
    </template>
  </BaseModal>
</template>

<style>
.export-input {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.export-description {
  color: var(--color-text-muted, #666);
  font-size: 0.875rem;
  margin: 0;
}

.export-result {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.not-found-warning code {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  word-break: break-all;
}

.result-stats {
  display: flex;
  gap: 1rem;
  padding: 0.75rem;
  background: var(--color-bg-secondary, #f9f9f9);
  border-radius: 6px;
}

.result-preview {
  max-height: 400px;
  overflow: auto;
  background: var(--color-bg-secondary, #1e1e1e);
  border-radius: 6px;
  padding: 1rem;
}

.result-preview pre {
  margin: 0;
  font-size: 0.75rem;
  white-space: pre-wrap;
  word-break: break-all;
}

.modal-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}
</style>
